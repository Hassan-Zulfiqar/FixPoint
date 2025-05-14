// Initialize the page when document is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize tooltips
    const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    tooltips.forEach(tooltip => new bootstrap.Tooltip(tooltip));
    
    // Initialize modals
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => new bootstrap.Modal(modal));

    // Image preview handling for add/edit service forms
    const imageInputs = document.querySelectorAll('input[type="file"][accept="image/*"]');
    imageInputs.forEach(input => {
        input.addEventListener('change', function(e) {
            // Create image preview container if it doesn't exist
            let preview = this.parentElement.querySelector('.image-preview');
            if (!preview) {
                preview = document.createElement('div');
                preview.className = 'image-preview mt-2';
                preview.style.width = '100%';
                preview.style.height = '150px';
                preview.style.backgroundSize = 'cover';
                preview.style.backgroundPosition = 'center';
                preview.style.backgroundRepeat = 'no-repeat';
                preview.style.border = '1px solid #dee2e6';
                preview.style.borderRadius = '0.5rem';
                this.parentElement.appendChild(preview);
            }
            
            if (this.files && this.files[0]) {
                const reader = new FileReader();
                reader.onload = e => {
                    preview.style.backgroundImage = `url(${e.target.result})`;
                    
                    // If this is the edit form, update the displayed image as well
                    const displayedImage = this.closest('form').querySelector('img');
                    if (displayedImage) {
                        displayedImage.src = e.target.result;
                    }
                };
                reader.readAsDataURL(this.files[0]);
            }
        });
    });

    // Handle form submission
    setupFormValidation();

    // Initialize MultiSelect for tags if present
    const tagSelects = document.querySelectorAll('.tag-select');
    tagSelects.forEach(select => {
        if (window.Choices) {
            new Choices(select, {
                removeItemButton: true,
                maxItemCount: 5,
                placeholder: true,
                placeholderValue: 'Select tags'
            });
        }
    });

    // Set up the initial page state
    loadServices();

    // Load all services when the page loads
    loadServices();

    // Handle form submissions
    const addServiceForm = document.querySelector('#addServiceModal form');
    if (addServiceForm) {
        addServiceForm.addEventListener('submit', handleAddService);
    }

    const editServiceForm = document.querySelector('#editServiceModal form');
    if (editServiceForm) {
        editServiceForm.addEventListener('submit', handleEditService);
    }

    // Setup search and filter handlers
    setupSearchAndFilters();
});

// Cache for all services
let allServices = [];

// Debounce function to limit the rate of function calls
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// Handle filtering and searching of services
function setupSearchAndFilters() {
    const searchInput = document.querySelector('input[placeholder="Search services..."]');
    const sortSelect = document.querySelector('select[aria-label="Sort By"]');
    const statusSelect = document.querySelector('select[aria-label="Status"]');

    function applyFilters() {
        const query = searchInput.value.toLowerCase();
        const sort = sortSelect.value;
        const status = statusSelect.value;
        
        // Cache the filtered services for reuse
        const filteredServices = window.allServices.filter(service => {
            const matchesQuery = !query || 
                service.title.toLowerCase().includes(query) ||
                service.description.toLowerCase().includes(query) ||
                service.category.toLowerCase().includes(query) ||
                (service.tags && service.tags.some(tag => tag.toLowerCase().includes(query)));
        
            const matchesStatus = status === 'all' ||
                (status === 'active' && service.isActive) ||
                (status === 'inactive' && !service.isActive);

            return matchesQuery && matchesStatus;
        });

        // Sort filtered services
        filteredServices.sort((a, b) => {
            switch(sort) {
                case 'name_asc':
                    return a.title.localeCompare(b.title);
                case 'name_desc':
                    return b.title.localeCompare(a.title);
                case 'price_asc':
                    return a.price - b.price;
                case 'price_desc':
                    return b.price - a.price;
                default:
                    return 0;
            }
        });

        // Update display
        displayServices(filteredServices);
    }

    // Add event listeners
    searchInput.addEventListener('input', debounce(applyFilters, 300));
    sortSelect.addEventListener('change', applyFilters);
    statusSelect.addEventListener('change', applyFilters);
}

// Create a service card element with complete service information
function createServiceCard(service) {
    // Handle image URL with proper path handling
    let imageUrl = '../images/default.jpg'; // Default fallback image
    
    if (service.images && service.images.length > 0) {
        const imagePath = service.images[0];
        if (imagePath.startsWith('http')) {
            imageUrl = imagePath;
        } else if (imagePath.startsWith('/uploads/')) {
            imageUrl = '..' + imagePath; // Convert to relative path
        } else if (imagePath.startsWith('uploads/')) {
            imageUrl = '../' + imagePath; // Convert to relative path
        } else if (imagePath.startsWith('/services/') || imagePath.startsWith('services/')) {
            // Handle service-specific images
            imageUrl = '../uploads' + (imagePath.startsWith('/') ? imagePath : '/' + imagePath);
        } else {
            imageUrl = imagePath; // Use as is
        }
    }

    // Format price based on type
    const formattedPrice = service.priceType === 'hourly' 
        ? `$${service.price}/hr`
        : service.priceType === 'per_sqft'
        ? `$${service.price}/sq.ft`
        : `$${service.price}`;

    // Format tags with proper styling
    const tagBadges = service.tags ? service.tags.map(tag => {
        const tagColors = {
            'emergency': 'bg-danger',
            'installation': 'bg-info',
            'maintenance': 'bg-secondary',
            'repair': 'bg-primary'
        };
        const badgeClass = tagColors[tag.toLowerCase()] || 'bg-secondary';
        return `<span class="badge ${badgeClass} me-2">${tag}</span>`;
    }).join('') : '';    const template = `
        <div class="col-md-6 col-lg-4 mb-4" data-service-id="${service._id}">
            <div class="card h-100 service-card">
                <div class="position-relative">
                    <img src="${imageUrl}" class="card-img-top service-img" alt="${service.title}" 
                         onerror="this.onerror=null; this.src='../images/default.jpg';">
                    <span class="position-absolute top-0 end-0 badge ${service.isActive ? 'status-active' : 'status-inactive'} m-2 px-3 py-2 rounded-pill">
                        ${service.isActive ? 'Active' : 'Inactive'}
                    </span>
                </div>
                <div class="card-body">
                    <h5 class="card-title">${service.title}</h5>
                    <div class="mb-3">
                        <span class="badge bg-success me-2">${service.category}</span>
                        ${tagBadges}
                    </div>
                    <p class="card-text">${service.description}</p>
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <span class="fw-bold text-primary">${formattedPrice}</span>
                        ${service.duration ? `<span class="text-muted small">${service.duration}</span>` : ''}
                    </div>
                    ${service.location ? `
                    <div class="small text-muted">
                        <i class="fas fa-map-marker-alt me-1"></i> ${service.location}
                        ${service.serviceArea ? ` - ${service.serviceArea}` : ''}
                    </div>` : ''}
                </div>                <div class="card-footer bg-white d-flex justify-content-end">
                    <div class="btn-group btn-group-sm">
                        <button class="btn ${service.isActive ? 'btn-outline-warning' : 'btn-outline-success'}" onclick="toggleServiceStatus('${service._id}')">
                            <i class="fas fa-toggle-${service.isActive ? 'off' : 'on'} me-1"></i> ${service.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button class="btn btn-outline-danger" onclick="deleteService('${service._id}')">
                            <i class="fas fa-trash-alt me-1"></i> Delete
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    const div = document.createElement('div');
    div.innerHTML = template;
    return div.firstElementChild;
}

// Display services in the grid
function displayServices(services) {
    const servicesGrid = document.getElementById('servicesGrid');
    const loadingElement = document.getElementById('loading');
    const noServicesElement = document.getElementById('noServices');

    // Hide loading state
    loadingElement.style.display = 'none';

    // Clear existing service cards
    Array.from(servicesGrid.children).forEach(child => {
        if (child !== loadingElement && child !== noServicesElement) {
            child.remove();
        }
    });

    if (services.length === 0) {
        noServicesElement.style.display = 'block';
        return;
    }

    noServicesElement.style.display = 'none';

    // Add each service card
    services.forEach(service => {
        servicesGrid.appendChild(createServiceCard(service));
    });
}

// Fetch all services from the API
async function loadServices() {
    try {
        // Show loading state
        const loadingElement = document.getElementById('loading');
        const noServicesElement = document.getElementById('noServices');
        loadingElement.style.display = 'block';
        noServicesElement.style.display = 'none';

        try {
            // Add authentication headers if available
            const headers = {};
            const token = localStorage.getItem('authToken');
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch('/api/provider/services', {
                headers: headers
            });
            
            const data = await response.json();
            
            if (data.success && data.data && data.data.length > 0) {
                // Cache services for filtering
                window.allServices = data.data;
                displayServices(data.data);
                return;
            } else {
                console.log('No services returned from API or error occurred');
                // Show message but continue to fallback
            }
        } catch (apiError) {
            console.error('API fetch error:', apiError);
            // Continue to fallback if API fails
        }
        
        // Show an informative message
        showToast('Showing demo services. Add your first service to get started!', 'info');
        
        // Fallback: Load demo services if there was an error or no services returned
        const demoServices = [
            {
                _id: 'demo1',
                title: 'Pipe Leak Repair',
                description: 'Professional repair of leaking pipes, faucets, and fixtures. Available for emergency calls.',
                category: 'Plumbing',
                price: 75,
                priceType: 'hourly',
                location: 'San Francisco, CA',
                serviceArea: '25 mile radius',
                isActive: true,
                tags: ['emergency', 'repair'],
                images: ['../images/default.jpg']
            },
            {
                _id: 'demo2',
                title: 'Bathroom Renovation',
                description: 'Complete bathroom renovation services including fixture replacement, tiling, and plumbing.',
                category: 'Plumbing',
                price: 2500,
                priceType: 'fixed',
                location: 'San Francisco, CA',
                serviceArea: '20 mile radius',
                isActive: true,
                tags: ['installation', 'renovation'],
                images: ['../images/default.jpg']
            }
        ];
        
        window.allServices = demoServices;
        displayServices(demoServices);
    } catch (error) {
        console.error('General error:', error);
        showToast('Error displaying services', 'danger');
    } finally {
        document.getElementById('loading').style.display = 'none';
    }
}

// Update the results count in the UI
function updateResultsCount(count) {
    const countElement = document.querySelector('.results-count');
    if (!countElement) {
        // Create the count element if it doesn't exist
        const searchCard = document.querySelector('.card');
        const cardBody = searchCard.querySelector('.card-body');
        const countDiv = document.createElement('div');
        countDiv.className = 'results-count small text-muted mt-2';
        cardBody.appendChild(countDiv);
    }
    
    document.querySelector('.results-count').textContent = 
        `Showing ${count} service${count !== 1 ? 's' : ''}`;
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

// Handle adding a new service
async function handleAddService(e) {
    e.preventDefault();

    const form = e.target;
    const formData = new FormData(form);

    // Add additional metadata
    const tags = [];
    form.querySelectorAll('.tag-checkbox:checked').forEach(checkbox => {
        tags.push(checkbox.value);
    });
    if (tags.length > 0) {
        formData.append('tags', JSON.stringify(tags));
    }    try {
        // Add authentication headers if available
        const headers = {};
        const token = localStorage.getItem('authToken');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch('/api/provider/services', {
            method: 'POST',
            headers: headers,
            body: formData
        });

        const data = await response.json();
        
        if (data.success) {
            showToast('Service added successfully', 'success');
            
            // Close modal and reset form
            const modal = bootstrap.Modal.getInstance(document.getElementById('addServiceModal'));
            modal.hide();
            form.reset();
            
            // Reload services to show the new one
            loadServices();
        } else {
            showToast('Error creating service: ' + data.message, 'danger');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Error creating service', 'danger');
    }
}

// Handle editing a service
async function editService(serviceId) {
    try {
        const response = await fetch(`/api/provider/services/${serviceId}`);
        const data = await response.json();
        
        if (data.success) {
            const service = data.data;
              // Fill the edit form with service data
            const form = document.querySelector('#editServiceModal form');
            form.elements['editServiceName'].value = service.title;
            form.elements['editServiceCategory'].value = service.category;
            form.elements['editMinPrice'].value = service.price;
            form.elements['editServiceDescription'].value = service.description;
            
            // Update service image if available
            if (service.images && service.images.length > 0) {
                const imageElement = form.querySelector('img');
                if (imageElement) {
                    let imagePath = service.images[0];
                    if (imagePath.startsWith('http')) {
                        imageElement.src = imagePath;
                    } else if (imagePath.startsWith('/uploads/')) {
                        imageElement.src = '..' + imagePath;
                    } else if (imagePath.startsWith('uploads/')) {
                        imageElement.src = '../' + imagePath;
                    } else {
                        imageElement.src = imagePath;
                    }
                }
            }
            
            // Set tags
            if (service.tags) {
                service.tags.forEach(tag => {
                    const checkbox = form.querySelector(`.tag-checkbox[value="${tag}"]`);
                    if (checkbox) checkbox.checked = true;
                });
            }
            
            // Store service ID for the update
            form.dataset.serviceId = serviceId;
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Error loading service details', 'danger');
    }
}

async function handleEditService(e) {
    e.preventDefault();

    const form = e.target;
    const serviceId = form.dataset.serviceId;
    const formData = new FormData(form);

    // Add tags if any are checked
    const tags = [];
    form.querySelectorAll('.tag-checkbox:checked').forEach(checkbox => {
        tags.push(checkbox.value);
    });
    if (tags.length > 0) {
        formData.append('tags', JSON.stringify(tags));
    }

    // Check if a new image was uploaded
    const imageInput = form.querySelector('input[type="file"]');
    if (imageInput.files.length === 0) {
        // If no new image, keep the existing one
        const currentImg = form.querySelector('img');
        if (currentImg && currentImg.src) {
            // We don't need to append anything for existing images
            console.log('Using existing image:', currentImg.src);
        }
    }

    try {
        // Add authentication headers if available
        const headers = {};
        const token = localStorage.getItem('authToken');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch(`/api/provider/services/${serviceId}`, {
            method: 'PUT',
            headers: headers,
            body: formData
        });

        const data = await response.json();
        
        if (data.success) {
            showToast('Service updated successfully', 'success');
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('editServiceModal'));
            modal.hide();
            
            // Reload services
            loadServices();
        } else {
            showToast('Error updating service: ' + data.message, 'danger');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Error updating service', 'danger');
    }
}

// Toggle service active/inactive status
async function toggleServiceStatus(serviceId) {
    if (!confirm('Are you sure you want to change the status of this service?')) {
        return;
    }

    try {
        // Add authentication headers if available
        const headers = {};
        const token = localStorage.getItem('authToken');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch(`/api/provider/services/${serviceId}/toggle-status`, {
            method: 'PATCH',
            headers: headers
        });

        const data = await response.json();
        
        if (data.success) {
            showToast('Service status updated successfully', 'success');
            loadServices();
        } else {
            showToast('Error updating service status: ' + data.message, 'danger');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Error updating service status', 'danger');
    }
}

// Delete a service
async function deleteService(serviceId) {
    if (!confirm('Are you sure you want to delete this service? This cannot be undone.')) {
        return;
    }

    try {
        // Add authentication headers if available
        const headers = {};
        const token = localStorage.getItem('authToken');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch(`/api/provider/services/${serviceId}`, {
            method: 'DELETE',
            headers: headers
        });

        const data = await response.json();
        
        if (data.success) {
            showToast('Service deleted successfully', 'success');
            loadServices();
        } else {
            showToast('Error deleting service: ' + data.message, 'danger');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Error deleting service', 'danger');
    }
}

// Form validation setup
function setupFormValidation() {
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', function(event) {
            if (!form.checkValidity()) {
                event.preventDefault();
                event.stopPropagation();
            }
            form.classList.add('was-validated');
        });
    });
}

// Service form helpers
function getFormData(form) {
    const formData = new FormData(form);
    
    // Handle tags
    const tags = Array.from(form.querySelectorAll('.tag-checkbox:checked')).map(cb => cb.value);
    formData.append('tags', JSON.stringify(tags));

    // Handle options if they exist
    const options = [];
    form.querySelectorAll('.option-row').forEach(row => {
        const name = row.querySelector('[name="optionName"]').value;
        const price = row.querySelector('[name="optionPrice"]').value;
        if (name && price) {
            options.push({ name, price });
        }
    });
    if (options.length > 0) {
        formData.append('options', JSON.stringify(options));
    }

    return formData;
}

// Price formatting helper
function formatPrice(price, type = 'fixed') {
    const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    });

    const formattedPrice = formatter.format(price);
    switch (type) {
        case 'hourly':
            return `${formattedPrice}/hr`;
        case 'per_sqft':
            return `${formattedPrice}/sq.ft`;
        default:
            return formattedPrice;
    }
}
