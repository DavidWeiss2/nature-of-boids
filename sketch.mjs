import { Boid } from "./Boid.js";

const numOfBoids = 50;

let width = window.innerWidth;
let height = window.innerHeight;
let canvasArea = width * height;
export const foodSize = 16;
export let debug = false;

export const becomeFoodAt = 55;

const boids = [];

window.setup = function () {
	createCanvas(width, height);
	background(0);
	for (let i = 0; i < numOfBoids; i++) {
		boids.push(new Boid());
	};
};

window.draw = function () {
	background(0);
	boids.sort((a, b) => b.health - a.health);
	for (let i = boids.length; i--;) {
		if (boids[i].health <= 0) {
			boids.splice(i, 1);
			continue;
		}
		if (boids[i].health <= becomeFoodAt) {
			boids[i].vel.mult(0);
			boids[i].health = becomeFoodAt;
			fill(0, 255, 0);
			noStroke();
			circle(boids[i].pos.x, boids[i].pos.y, foodSize);
			continue;
		}
		boids[i].ai(boids.slice(0, i), boids.slice(i + 1, boids.length));
		boids[i].edges();
		boids[i].update();
		boids[i].show();
		boids[i].health **= 0.9999;
	}
	if (boids.length < numOfBoids && random() < 0.1) {
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