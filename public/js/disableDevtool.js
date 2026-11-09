// document.addEventListener('contextmenu', function (e) {
//     e.preventDefault();
// }, false);

// document.addEventListener('keydown', function (e) {
//     if (e.key === 'F12' || e.keyCode === 123) {
//         e.preventDefault();
//         return false;
//     }

//     if (e.ctrlKey && e.shiftKey && (
//         e.key.toLowerCase() === 'i' ||
//         e.key.toLowerCase() === 'j' ||
//         e.key.toLowerCase() === 'c'
//     )) {
//         e.preventDefault();
//         return false;
//     }

//     if (e.ctrlKey && (e.key.toLowerCase() === 'u')) {
//         e.preventDefault();
//         return false;
//     }

//     if (e.ctrlKey && (e.key.toLowerCase() === 's')) {
//         e.preventDefault();
//         return false;
//     }
// });

// setInterval(() => {
//     const devtoolsOpen =
//         (window.outerWidth - window.innerWidth > 160) ||
//         (window.outerHeight - window.innerHeight > 160);

//     if (devtoolsOpen) {
//         document.body.innerHTML = "<div style='color:red;text-align:center;margin-top:100px'></div>";
//     }
// }, 500);


// document.addEventListener('keyup', e => {
//     if (e.key === 'F12') e.preventDefault();
// });