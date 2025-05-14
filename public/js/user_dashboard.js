// User Dashboard JS
document.addEventListener('DOMContentLoaded', function() {
    // Initialize tooltips and popovers
    const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    tooltips.forEach(tooltip => new bootstrap.Tooltip(tooltip));
    
    // Fetch and display user data
    loadUserData();
    
    // Setup notifications
    setupNotifications();
});

// Load user data from API
async function loadUserData() {
    try {
        // Fetch user profile data using session cookies
        const response = await fetch('/api/user/profile', {
            credentials: 'include' // Send cookies with the request
        });

        if (!response.ok) {
            throw new Error('Failed to fetch user profile');
        }

        const data = await response.json();
        
        if (data.success) {
            displayUserData(data.data);
        } else {
            console.error('Error fetching user profile:', data.message);
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Error loading profile data', 'danger');
    }
}

// Display user data in the UI
function displayUserData(user) {
    // Set user profile information in navbar
    const userDropdownToggle = document.getElementById('userDropdown');
    if (userDropdownToggle) {
        // Clear existing content
        userDropdownToggle.innerHTML = '';
          // Create profile image element
        const profileImg = document.createElement('img');
        // Format image source with proper path handling
        let profilePicUrl = '../images/default.jpg';
        
        if (user.profile_pic) {
            // Handle relative and absolute paths
            if (user.profile_pic.startsWith('http')) {
                profilePicUrl = user.profile_pic;
            } else if (user.profile_pic.startsWith('/uploads/')) {
                profilePicUrl = '..'.concat(user.profile_pic);
            } else if (!user.profile_pic.startsWith('/')) {
                profilePicUrl = '../uploads/' + user.profile_pic;
            } else {
                profilePicUrl = '..'.concat(user.profile_pic);
            }
        }
        
        profileImg.src = profilePicUrl;
        profileImg.alt = 'Profile';
        profileImg.className = 'rounded-circle me-2';
        profileImg.style.width = '24px';
        profileImg.style.height = '24px';
        profileImg.style.objectFit = 'cover';
        profileImg.onerror = function() {
            this.src = '../images/default.jpg';
        };
        
        // Append image and username
        userDropdownToggle.appendChild(profileImg);
        userDropdownToggle.appendChild(document.createTextNode(user.name));
    }
    
    // Update welcome section
    const welcomeSection = document.querySelector('.profile-header .d-flex');
    if (welcomeSection) {        const profileImage = welcomeSection.querySelector('img');
        if (profileImage) {
            // Format image source with proper path handling
            let profilePicUrl = '../images/default.jpg';
            
            if (user.profile_pic) {
                // Handle relative and absolute paths
                if (user.profile_pic.startsWith('http')) {
                    profilePicUrl = user.profile_pic;
                } else if (user.profile_pic.startsWith('/uploads/')) {
                    profilePicUrl = '..'.concat(user.profile_pic);
                } else if (!user.profile_pic.startsWith('/')) {
                    profilePicUrl = '../uploads/' + user.profile_pic;
                } else {
                    profilePicUrl = '..'.concat(user.profile_pic);
                }
            }
            
            profileImage.src = profilePicUrl;
            profileImage.onerror = function() {
                this.src = '../images/default.jpg';
            };
        }
        
        const welcomeHeading = welcomeSection.querySelector('h2');
        if (welcomeHeading) {
            welcomeHeading.textContent = `Welcome back, ${user.name.split(' ')[0]}!`;
        }
    }
    
    // Load service request stats
    loadServiceRequestStats();
}

// Load service request statistics
async function loadServiceRequestStats() {
    try {
        const response = await fetch('/api/user/service-requests', {
            credentials: 'include' // Send cookies with the request
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch service requests');
        }
        
        const data = await response.json();
        
        if (data.success) {
            // Calculate statistics
            const stats = calculateStats(data.data);
            updateStats(stats);
        } else {
            console.error('Error fetching service requests:', data.message);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

// Calculate statistics from service requests
function calculateStats(serviceRequests) {
    // Count active requests (pending, approved, in-progress)
    const activeRequests = serviceRequests.filter(req => 
        ['pending', 'approved', 'in-progress'].includes(req.status)
    ).length;
    
    // Count completed requests
    const completed = serviceRequests.filter(req => 
        req.status === 'completed'
    ).length;
    
    // Calculate satisfaction rate if there are reviews
    let satisfactionRate = 0;
    const reviewedRequests = serviceRequests.filter(req => req.review && req.review.rating);
    
    if (reviewedRequests.length > 0) {
        const totalRating = reviewedRequests.reduce((sum, req) => sum + req.review.rating, 0);
        satisfactionRate = Math.round((totalRating / (reviewedRequests.length * 5)) * 100);
    }
    
    return { activeRequests, completed, satisfactionRate };
}

// Update user statistics in the dashboard
function updateStats(stats) {
    const activeRequestsEl = document.querySelector('.quick-stats .active-requests');
    const completedEl = document.querySelector('.quick-stats .completed');
    const satisfactionEl = document.querySelector('.satisfaction-rate');
    
    if (activeRequestsEl) {
        activeRequestsEl.textContent = stats.activeRequests;
    }
    
    if (completedEl) {
        completedEl.textContent = stats.completed;
    }
    
    if (satisfactionEl && stats.satisfactionRate) {
        satisfactionEl.style.width = `${stats.satisfactionRate}%`;
        satisfactionEl.textContent = `${stats.satisfactionRate}% Satisfaction`;
    }
}

// Setup notifications
function setupNotifications() {
    // This would typically fetch notifications from an API endpoint
    // For now, we're just setting up the UI interaction
    const notificationDropdown = document.getElementById('notificationDropdown');
    if (notificationDropdown) {
        notificationDropdown.addEventListener('click', function(e) {
            // Mark notifications as read when dropdown is opened
            const badge = document.querySelector('.notification-badge');
            if (badge) {
                badge.style.display = 'none';
            }
        });
    }
}

// Show toast notifications
function showToast(message, type = 'info') {
    const toastContainer = document.querySelector('.toast-container') || (() => {
        const container = document.createElement('div');
        container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        document.body.appendChild(container);
        return container;
    })();

    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${type} border-0`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');

    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    `;

    toastContainer.appendChild(toast);
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();

    toast.addEventListener('hidden.bs.toast', () => toast.remove());
}
