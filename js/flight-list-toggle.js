// Flight List Collapse/Expand functionality
document.addEventListener('DOMContentLoaded', () => {
    const flightListToggle = document.getElementById('flightListToggle');
    const flightListItems = document.getElementById('flightListItems');
    const flightListHeader = document.getElementById('flightListHeader');

    if (flightListToggle && flightListItems && flightListHeader) {
        // Toggle on button click
        flightListToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleFlightList();
        });

        // Toggle on header click
        flightListHeader.addEventListener('click', () => {
            toggleFlightList();
        });

        function toggleFlightList() {
            flightListItems.classList.toggle('collapsed');
            flightListToggle.classList.toggle('collapsed');
        }
    }
});
