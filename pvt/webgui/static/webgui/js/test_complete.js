// This script expects the backend to render or inject the harmonic mean and valid percentage values.
// If using Django context, you can render them directly in the template.
// If using localStorage or another method, fetch and display them here.

document.addEventListener('DOMContentLoaded', function() {
    // Example: fetch from localStorage (adjust as needed)
    const harmonicMean = localStorage.getItem('harmonicMean') || '--';
    const validPercentage = localStorage.getItem('validPercentage') || '--';
    document.getElementById('harmonic-mean').textContent = harmonicMean;
    document.getElementById('valid-percentage').textContent = validPercentage;
});
