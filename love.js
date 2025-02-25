var settings = {
    particles: {
        length: 500, 
        duration: 2,
        velocity: 100,
        effect: -0.75,
        size: 30,
    },
};

(function(){var b=0;var c=["ms","moz","webkit","o"];for(var a=0;a<c.length&&!window.requestAnimationFrame;++a){window.requestAnimationFrame=window[c[a]+"RequestAnimationFrame"];window.cancelAnimationFrame=window[c[a]+"CancelAnimationFrame"]||window[c[a]+"CancelRequestAnimationFrame"]}if(!window.requestAnimationFrame){window.requestAnimationFrame=function(h,e){var d=new Date().getTime();var f=Math.max(0,16-(d-b));var g=window.setTimeout(function(){h(d+f)},f);b=d+f;return g}}if(!window.cancelAnimationFrame){window.cancelAnimationFrame=function(d){clearTimeout(d)}}}());

var Point = (function() { 
    function Point(x, y) {
        this.x = (typeof x !== 'undefined') ? x : 0;
        this.y = (typeof y !== 'undefined') ? y : 0;
    }   
    Point.prototype.clone = function() { 
        return new Point(this.x, this.y);
    };
    Point.prototype.length = function(length) { 
        if (typeof length == 'undefined')
        return Math.sqrt(this.x * this.x + this.y * this.y);
        this.normalize();
        this.x *= length;
        this.y *= length;
        return this;
    };
    Point.prototype.normalize = function() {
        var length = this.length();
        this.x /= length;
        this.y /= length;
        return this;
    };

    return Point;
})();

var Particle = (function() { 
    function Particle() {
        this.position = new Point();
        this.velocity = new Point();
        this.acceleration = new Point();
        this.age = 0;
    }
    Particle.prototype.initialize = function(x, y, dx, dy) {
        this.position.x = x;
        this.position.y = y;
        this.velocity.x = dx;
        this.velocity.y = dy;
        this.acceleration.x = dx * settings.particles.effect;
        this.acceleration.y = dy * settings.particles.effect;
        this.age = 0;
    };
    Particle.prototype.update = function(deltaTime) {
        this.position.x += this.velocity.x * deltaTime;
        this.position.y += this.velocity.y * deltaTime;
        this.velocity.x += this.acceleration.x * deltaTime;
        this.velocity.y += this.acceleration.y * deltaTime;
        this.age += deltaTime;
    };
    Particle.prototype.draw = function(context, image) {
        function ease(t) { 
        return (--t) * t * t + 1;
        }
        var size = image.width * ease(this.age / settings.particles.duration);
        context.globalAlpha = 1 - this.age / settings.particles.duration;
        context.drawImage(image, this.position.x - size / 2, this.position.y - size / 2, size, size);
    };

    return Particle;
})();

var ParticlePool = (function() { 
    var particles, firstActive = 0, firstFree = 0, duration = settings.particles.duration;

    function ParticlePool(length) {
        particles = new Array(length);
        for (var i = 0; i < particles.length; i++)
        particles[i] = new Particle();
    }
    ParticlePool.prototype.add = function(x, y, dx, dy) {
        particles[firstFree].initialize(x, y, dx, dy);
        firstFree++;

        if (firstFree == particles.length) {
            firstFree = 0;
        }
        if (firstActive == firstFree) {
            firstActive++;
        }
        if (firstActive == particles.length) {
            firstActive = 0;
        }
    };
    ParticlePool.prototype.update = function(deltaTime) {
        var i;
        
        if (firstActive < firstFree) {
            for (i = firstActive; i < firstFree; i++) {
                particles[i].update(deltaTime);
            }
        }
        if (firstFree < firstActive) {
            for (i = firstActive; i < particles.length; i++) {
                particles[i].update(deltaTime);
            }
            for (i = 0; i < firstFree; i++) {
                particles[i].update(deltaTime);
            }
        }
        while (particles[firstActive].age >= duration && firstActive != firstFree) {
            firstActive++;
            if (firstActive == particles.length) {
                firstActive = 0;
            }
        }
    };
    ParticlePool.prototype.draw = function(context, image) {
        var i;
        if (firstActive < firstFree) {
            for (i = firstActive; i < firstFree; i++) {
                particles[i].draw(context, image);
            }
        }
        if (firstFree < firstActive) {
            for (i = firstActive; i < particles.length; i++) {
                particles[i].draw(context, image);
            }
            for (i = 0; i < firstFree; i++) {
                particles[i].draw(context, image);
            }
        }
    };

    return ParticlePool;
})();

function initializeHeartAnimation() {
    var canvas = document.getElementById('pinkboard');
    var context = canvas.getContext('2d');
    var particles = new ParticlePool(settings.particles.length);
    var particleRate = settings.particles.length / settings.particles.duration;
    var time;

    function pointOnHeart(t) {
        return new Point(
            160 * Math.pow(Math.sin(t), 3),
            130 * Math.cos(t) - 50 * Math.cos(2 * t) - 20 * Math.cos(3 * t) - 10 * Math.cos(4 * t) + 25
        );
    }

    var image = (function() {
        var canvas  = document.createElement('canvas');
        var context = canvas.getContext('2d');
        canvas.width  = settings.particles.size;
        canvas.height = settings.particles.size;

        function to(t) {
            var point = pointOnHeart(t);
            point.x = settings.particles.size / 2 + point.x * settings.particles.size / 350;
            point.y = settings.particles.size / 2 - point.y * settings.particles.size / 350;
        
            return point;
        }

        context.beginPath();
        var t = -Math.PI;
        var point = to(t);
        context.moveTo(point.x, point.y);

        while (t < Math.PI) {
            t += 0.01;
            point = to(t);
            context.lineTo(point.x, point.y);
        }

        context.closePath();
        context.fillStyle = '#ea80b0';
        context.fill();
        var image = new Image();
        image.src = canvas.toDataURL();

        return image;
    })();

    function render() {
        requestAnimationFrame(render);
        var newTime = new Date().getTime() / 1000, deltaTime = newTime - (time || newTime);
        time = newTime;
        context.clearRect(0, 0, canvas.width, canvas.height);
        var amount = particleRate * deltaTime;

        for (var i = 0; i < amount; i++) {
            var pos = pointOnHeart(Math.PI - 2 * Math.PI * Math.random());
            var dir = pos.clone().length(settings.particles.velocity);
            particles.add(canvas.width / 2 + pos.x, canvas.height / 2 - pos.y, dir.x, -dir.y);
        }
        
        particles.update(deltaTime);
        particles.draw(context, image);
    }

    function onResize() {
        canvas.width  = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
    }

    window.onresize = onResize;
    
    onResize();
    render();
}

function animateText(element, delay) {
    if (!element) return;
    
    const text = element.textContent;
    element.textContent = '';
    
    for (let i = 0; i < text.length; i++) {
        const span = document.createElement('span');
        span.textContent = text[i];
        span.style.display = 'inline-block';
        span.style.animation = `scanEffect 0.5s ${i * 0.1 + delay}s forwards`;
        element.appendChild(span);
    }
}

function createButterfly(color) {
    const butterfly = document.createElement('div');
    butterfly.className = `butterfly butterfly-${color}`;
    
    const leftWing = document.createElement('div');
    leftWing.className = 'butterfly-wing butterfly-left-wing';
    
    const rightWing = document.createElement('div');
    rightWing.className = 'butterfly-wing butterfly-right-wing';
    
    const body = document.createElement('div');
    body.className = 'butterfly-body';
    
    butterfly.appendChild(leftWing);
    butterfly.appendChild(rightWing);
    butterfly.appendChild(body);
    
    return butterfly;
}

function spawnButterflyBurst(x, y, count = 10) {
    const colors = ['pink', 'green', 'blue'];
    
    for (let i = 0; i < count; i++) {
        const color = colors[Math.floor(Math.random() * colors.length)];
        const butterfly = createButterfly(color);
        
        butterfly.style.left = `${x}px`;
        butterfly.style.top = `${y}px`;
        
        const duration = 5 + Math.random() * 10; 
        const delay = Math.random() * 2;
        const scale = 0.5 + Math.random() * 1.5;
        
        butterfly.style.animation = `fly ${duration}s linear ${delay}s infinite`;
        butterfly.style.transform = `scale(${scale})`;
        
        const angle = Math.random() * 360;
        const distance = 100 + Math.random() * 300;
        
        butterfly.animate([
            { transform: `translate(0, 0) scale(${scale}) rotate(0deg)` },
            { transform: `translate(${distance * Math.cos(angle)}px, ${distance * Math.sin(angle)}px) scale(${scale}) rotate(${angle}deg)` }
        ], {
            duration: duration * 1000,
            easing: 'ease-in-out',
            iterations: 1
        });
        
        setTimeout(() => {
            if (butterfly.parentNode) {
                butterfly.parentNode.removeChild(butterfly);
            }
        }, duration * 1000);
        
        document.body.appendChild(butterfly);
    }
}

function createContinuousButterflies(container, count = 15) {
    const colors = ['pink', 'green', 'blue'];
    const butterflyContainer = document.createElement('div');
    butterflyContainer.className = 'butterfly-container';
    
    for (let i = 0; i < count; i++) {
        const color = colors[Math.floor(Math.random() * colors.length)];
        const butterfly = createButterfly(color);
        
        const startX = Math.random() * window.innerWidth;
        const startY = Math.random() * window.innerHeight;
        butterfly.style.left = `${startX}px`;
        butterfly.style.top = `${startY}px`;
        
        const duration = 15 + Math.random() * 20;
        const delay = Math.random() * 5;
        const scale = 0.5 + Math.random() * 1.5;
        
        butterfly.style.animation = `fly ${duration}s linear ${delay}s infinite`;
        butterfly.style.transform = `scale(${scale})`;
        
        butterflyContainer.appendChild(butterfly);
    }
    
    container.appendChild(butterflyContainer);
    return butterflyContainer;
}

function onResize() {
    const canvas = document.getElementById('pinkboard');
    if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
}

window.addEventListener('resize', onResize);
onResize();

document.addEventListener("DOMContentLoaded", function() {
    const audio = document.getElementById("background-music");
    const playButton = document.getElementById("play-music");
    const toGalleryButton = document.getElementById("toGallery");
    let galleryButterflies = null;
    
    playButton.addEventListener("click", function(e) {

        audio.play()
            .then(() => {
                console.log("Music is playing");
                playButton.style.display = "none";
                spawnButterflyBurst(e.clientX, e.clientY, 15);
            })
            .catch((error) => {
                console.error("Failed to play music:", error);
                alert("Please interact with the page first to enable audio playback");
            });
    });

    toGalleryButton.addEventListener('click', function(e) {
        document.getElementById('home').style.display = 'none';
        document.getElementById('gallery').style.display = 'block';
        
        spawnButterflyBurst(e.clientX, e.clientY, 15);
        
        if (!galleryButterflies) {
            galleryButterflies = createContinuousButterflies(document.getElementById('gallery'), 20);
        }
    });

    document.getElementById('toLetter').addEventListener('click', function() {
        document.getElementById('gallery').style.display = 'none';
        document.getElementById('letter').style.display = 'block';
        
        if (galleryButterflies && galleryButterflies.parentNode) {
            galleryButterflies.parentNode.removeChild(galleryButterflies);
            galleryButterflies = null;
        }
    });

    document.getElementById('toLove').addEventListener('click', function() {
        document.getElementById('letter').style.display = 'none';
        document.getElementById('pinkboard').style.display = 'block';
        document.getElementById('loveAnimation').style.display = 'block';
        initializeHeartAnimation();
    });
});