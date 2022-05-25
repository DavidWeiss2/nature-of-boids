export class Boid {
    perceptionRadius = 100;

    constructor(x = random(window.innerWidth), y = random(window.innerHeight)) {
        this.pos = createVector(x, y);
        this.vel = createVector(1, 0);
        this.acc = createVector(0, 0);
        this.maxSpeed = 4;
        this.maxForce = 0.2;
        this.r = 16;

        this.wanderTheta = PI / 2;

        this.currentPath = [];
    }

    ai() {
        this.applyForce(this.wander());
    }

    wander() {
        let wanderPoint = this.vel.copy();
        wanderPoint.setMag(this.perceptionRadius);
        wanderPoint.add(this.pos);
        // fill(255, 0, 0);
        // noStroke();
        // circle(wanderPoint.x, wanderPoint.y, 8);

        let wanderRadius = this.perceptionRadius;
        // noFill();
        // stroke(255);
        // circle(wanderPoint.x, wanderPoint.y, wanderRadius * 2);
        // line(this.pos.x, this.pos.y, wanderPoint.x, wanderPoint.y);

        let theta = this.wanderTheta + this.vel.heading();
        let x = wanderRadius * cos(theta);
        let y = wanderRadius * sin(theta);

        wanderPoint.add(x, y);
        // fill(0, 255, 0);
        // noStroke();
        // circle(wanderPoint.x, wanderPoint.y, 16);

        // stroke(255);
        // line(this.pos.x, this.pos.y, wanderPoint.x, wanderPoint.y);

        let displaceRange = 0.3;
        this.wanderTheta += random(-displaceRange, displaceRange);

        return this.arrive(wanderPoint);
    }



    seek(target, arrival = false) {
        let force = p5.Vector.sub(target, this.pos);
        let desiredForce = this.maxForce;
        if (arrival) {
            let slowRadius = this.perceptionRadius;
            let distance = force.mag();
            if (distance < slowRadius) {
                desiredForce = map(distance, 0, slowRadius, -this.maxForce, this.maxForce);
            }
        }
        force.setMag(desiredForce);
        return force;
    }

    evade(boid) {
        let pursuit = this.pursue(boid);
        pursuit.mult(-1);
        return pursuit;
    }

    pursue(boid) {
        let target = boid.pos.copy();
        let prediction = boid.vel.copy();
        prediction.mult(10);
        target.add(prediction);
        fill(0, 255, 0);
        circle(target.x, target.y, 16);
        return this.seek(target);
    }

    arrive(target) {
        // 2nd argument true enables the arrival behavior
        return this.seek(target, true);
    }

    flee(target) {
        return this.seek(target).mult(-1);
    }

    applyForce(force) {
        this.acc.add(force);
    }

    update() {
        this.vel.add(this.acc);
        this.vel.limit(this.maxSpeed);
        this.pos.add(this.vel);
        this.acc.set(0, 0);

        this.currentPath.push(this.pos.copy());
        if (this.currentPath.length > 100) {
            this.currentPath.shift();
        }
    }

    show() {
        stroke(255);
        strokeWeight(2);
        fill(255);
        push();
        translate(this.pos.x, this.pos.y);
        rotate(this.vel.heading());
        triangle(-this.r*2, -this.r / 2, -this.r*2, this.r / 2, 0, 0);
        pop();

        beginShape();
        noFill();
        for (let v of this.currentPath) {
            vertex(v.x, v.y);
        }
        endShape();
    }

    edges() {
        let hitEdge = false;
        if (this.pos.x > width + this.r) {
            this.pos.x = -this.r;
            hitEdge = true;
        } else if (this.pos.x < -this.r) {
            this.pos.x = width + this.r;
            hitEdge = true;
        }
        if (this.pos.y > height + this.r) {
            this.pos.y = -this.r;
            hitEdge = true;
        } else if (this.pos.y < -this.r) {
            this.pos.y = height + this.r;
            hitEdge = true;
        }

        if (hitEdge) {
            this.currentPath = [];
        }
    }
}