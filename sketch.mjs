import { Boid } from "./Boid.js";

const numOfBoids = 50;

let width = window.innerWidth;
let height = window.innerHeight;
let canvasArea = width * height;
export const foodSize = 16;
export let debug = true;

export const becomeFoodAt = 55;
const warn = window.console.warn;
window.console.warn = function (...args) {
	warn(...args);
	debugger;
}

let boids = [];

window.setup = function () {
	createCanvas(width, height);
	background(0);
	for (let i = 0; i < numOfBoids; i++) {
		boids.push(new Boid());
	};
};

window.draw = function () {
	background(0);
	boids = boids.sort((a, b) => b.health - a.health).filter(b => b.health > 0);
	for (let i = boids.length; i--;) {
		if (boids[i].health <= 0) {
			continue;
		}
		if (boids[i].health <= becomeFoodAt) {
			boids[i].vel.setMag(0);
			boids[i].health = becomeFoodAt;
			boids[i].color = null;
			fill(0, 255, 0);
			noStroke();
			circle(boids[i].pos.x, boids[i].pos.y, foodSize);
			continue;
		}
		const { avoid, seek, flock } = boids.filter(b => b.health >= 0).reduce((acc, boid, bIndex) => {
			if(boid.health <= 0) return acc;
			if(boid === boids[i]) return acc;
			if(boid.color?.toString() === boids[i].color?.toString()) {
				acc.flock.push(boid);
			} else if(bIndex > i) {
				acc.seek.push(boid);
			} else {
				acc.avoid.push(boid);
			}
			return acc;
		}, { avoid: [], seek: [], flock: [] });
		boids[i].ai(avoid, seek, flock);
		boids[i].edges();
		boids[i].update();
		boids[i].show();
		if(flock.length === 0) {
			boids[i].health **= 0.9999;
		}
	}
	if (boids.filter(b => b.health > becomeFoodAt).length < numOfBoids && random() < 0.1) {
		let color = random(1)>0.5 ? boids[Math.floor(random(boids.length))].color : null;
		boids.push(new Boid(color));
	}
};

window.mouseClicked = function () {
	const boidColor = color(random(255), random(255), random(255));
	boids.push(new Boid(boidColor, mouseX, mouseY));
}

window.keyReleased = function () {
	if (keyCode === ENTER) {
		debug = !debug;
	}
};

window.onresize = function () {
	width = window.innerWidth;
	height = window.innerHeight;
	canvasArea = width * height;
	resizeCanvas(width, height);
}

document.oncontextmenu = function () {
	return false;
}