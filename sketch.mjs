import "./p5.js";
import { Boid } from "./Boid.js";

const numOfBoids = 30;

let width = window.innerWidth;
let height = window.innerHeight;
let canvasArea = width * height;
let debug = false;

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
	boids[Math.floor(boids.length / 2)].debug = debug;
	boids[0].debug = debug;
	boids[boids.length-1].debug = debug;
	for (let i = boids.length; i--;) {
		if (boids[i].health <= 0) {
			boids.splice(i, 1);
			continue;
		}
		if (boids[i].health <= 55) {
			boids[i].vel.mult(0);
			fill(0, 255, 0);
			noStroke();
			circle(boids[i].pos.x, boids[i].pos.y, 16);
			continue;
		}
		boids[i].ai(boids.slice(0, i), boids.slice(i + 1, boids.length));
		boids[i].edges();
		boids[i].update();
		boids[i].show();
		boids[i].health **= 0.9999;
		boids[i].debug = false;
	}
	if (boids.length < numOfBoids && random() < 0.1) {
		let color = boids[Math.floor(random(boids.length))].color;
		boids.push(new Boid());
	}
};

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