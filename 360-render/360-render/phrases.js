const phrases = [
    "Let's keep rolling — 15 minutes, make it count.",
    "That's a wrap only when quality says so.",
    "Cut! Great take — now do it even better.",
    "Action! Every task is a scene worth nailing.",
    "You're doing great — stay on time, stay on story.",
    "With great power comes great AHT responsibility.",
    "Just keep swimming… through the queue.",
    "To infinity and beyond — within 15 min!",
    "May the queue be ever in your favor.",
    "Teamwork makes the dream work — lights, camera, go!",
    "This is the way — quality, pace, together.",
    "Roll camera. Own it. That's how legends are made.",
];

const el = document.getElementById('player-phrase');
let index = Math.floor(Math.random() * phrases.length);
el.textContent = phrases[index];

setInterval(() => {
    el.classList.add('fade-out');
    setTimeout(() => {
        index = (index + 1) % phrases.length;
        el.textContent = phrases[index];
        el.classList.remove('fade-out');
    }, 600);
}, 8000);
