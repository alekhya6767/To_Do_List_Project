// filepath: github-pages-webapp/github-pages-webapp/src/scripts/app.js
document.addEventListener('DOMContentLoaded', function() {
    const appTitle = document.createElement('h1');
    appTitle.textContent = 'Welcome to My GitHub Pages Web App';
    document.body.appendChild(appTitle);

    const button = document.createElement('button');
    button.textContent = 'Click Me';
    document.body.appendChild(button);

    button.addEventListener('click', function() {
        alert('Button was clicked!');
    });
});