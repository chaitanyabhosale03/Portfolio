import {} from "./js/dark.js";
import { sr } from './js/slider.js';
import { literallyme } from "./js/me.js";

// Initial ScrollReveal on load
sr.reveal('#main', {
    delay: 200,
    origin: "left"
});

// Swup page transitions
const swup = new Swup({
    containers: ["#swup"]
});

console.log("design & coded by Chaitanya Bhosale");
console.log(literallyme);

// Reveal animations after page transitions
swup.hooks.on('page:view', () => {
    sr.reveal('.about-left', {
        delay: 200,
        origin: "left"
    });
    sr.reveal('#main', {
        delay: 200,
        origin: "left"
    });
    sr.reveal('.about-right', {
        delay: 200,
        origin: "top"
    });
    sr.reveal('.wrapper', {
        delay: 100,
        origin: "bottom"
    });
    sr.reveal('.wrapper1', {
        delay: 100,
        origin: "top"
    });
    sr.reveal('.wrapper2', {
        delay: 100,
        origin: "right"
    });
    sr.reveal('#prj li', {
        delay: 150,
        origin: "top"
    });
});
