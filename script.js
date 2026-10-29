/*
Everybody say Happy Birthday! This gift is a compound of various pens plus some other things I added
- gift 
https://codepen.io/ElaineXu/pen/EWvGWX
- neon 
https://codepen.io/markheggan/pen/LjrVYN
- fireworks 
https://codepen.io/chuongdang/pen/yzpDG
- moon 
https://codepen.io/agelber/pen/sjIKp
*/
window.requestAnimFrame = ( function() {
	return window.requestAnimationFrame ||
				window.webkitRequestAnimationFrame ||
				window.mozRequestAnimationFrame ||
				function( callback ) {
					window.setTimeout( callback, 1000 / 60 );
				};
})();

// now we will setup our basic variables for the demo
var canvas = document.getElementById( 'canvas' ),
		ctx = canvas.getContext( '2d' ),
		// full screen dimensions
		cw = window.innerWidth,
		ch = window.innerHeight,
		// firework collection
		fireworks = [],
		// particle collection
		particles = [],
		// starting hue
		hue = 120,
		// when launching fireworks with a click, too many get launched at once without a limiter, one launch per 5 loop ticks
		limiterTotal = 5,
		limiterTick = 0,
		// this will time the auto launches of fireworks, one launch per 80 loop ticks
		timerTotal = 80,
		timerTick = 0,
		mousedown = false,
		// mouse x coordinate,
		mx,
		// mouse y coordinate
		my;
		
// set canvas dimensions
canvas.width = cw;
canvas.height = ch;

// get a random number within a range
function random( min, max ) {
	return Math.random() * ( max - min ) + min;
}

// calculate the distance between two points
function calculateDistance( p1x, p1y, p2x, p2y ) {
	var xDistance = p1x - p2x,
			yDistance = p1y - p2y;
	return Math.sqrt( Math.pow( xDistance, 2 ) + Math.pow( yDistance, 2 ) );
}

// create firework
function Firework( sx, sy, tx, ty ) {
	// actual coordinates
	this.x = sx;
	this.y = sy;
	// starting coordinates
	this.sx = sx;
	this.sy = sy;
	// target coordinates
	this.tx = tx;
	this.ty = ty;
	// distance from starting point to target
	this.distanceToTarget = calculateDistance( sx, sy, tx, ty );
	this.distanceTraveled = 0;
	// track the past coordinates of each firework to create a trail effect
	this.coordinates = [];
	this.coordinateCount = 3;
	// populate initial coordinate collection with the current coordinates
	while( this.coordinateCount-- ) {
		this.coordinates.push( [ this.x, this.y ] );
	}
	this.angle = Math.atan2( ty - sy, tx - sx );
	this.speed = 2;
	this.acceleration = 1.05;
	this.brightness = random( 50, 70 );
	// circle target indicator radius
	this.targetRadius = 1;
}

// update firework
Firework.prototype.update = function( index ) {
	// remove last item in coordinates array
	this.coordinates.pop();
	// add current coordinates to the start of the array
	this.coordinates.unshift( [ this.x, this.y ] );
	
	// cycle the circle target indicator radius
	if( this.targetRadius < 8 ) {
		this.targetRadius += 0.3;
	} else {
		this.targetRadius = 1;
	}
	
	// speed up the firework
	this.speed *= this.acceleration;
	
	// get the current velocities based on angle and speed
	var vx = Math.cos( this.angle ) * this.speed,
			vy = Math.sin( this.angle ) * this.speed;
	// how far will the firework have traveled with velocities applied?
	this.distanceTraveled = calculateDistance( this.sx, this.sy, this.x + vx, this.y + vy );
	
	// if the distance traveled is greater than the initial distance to the target, the target has been reached
	if( this.distanceTraveled >= this.distanceToTarget ) {
		createParticles( this.tx, this.ty );
		// remove the firework
		fireworks.splice( index, 1 );
	} else {
		// target not reached, keep traveling
		this.x += vx;
		this.y += vy;
	}
}

// draw firework
Firework.prototype.draw = function() {
	ctx.beginPath();
	// move to the last tracked coordinate in the set, then draw a line to the current x and y
	ctx.moveTo( this.coordinates[ this.coordinates.length - 1][ 0 ], this.coordinates[ this.coordinates.length - 1][ 1 ] );
	ctx.lineTo( this.x, this.y );
	ctx.strokeStyle = 'hsl(' + hue + ', 100%, ' + this.brightness + '%)';
	ctx.stroke();
	
	ctx.beginPath();
	// draw the target for this firework with a pulsing circle
	ctx.arc( this.tx, this.ty, this.targetRadius, 0, Math.PI * 2 );
	ctx.stroke();
}

// create particle
function Particle( x, y ) {
	this.x = x;
	this.y = y;
	// track the past coordinates of each particle to create a trail effect
	this.coordinates = [];
	this.coordinateCount = 5;
	while( this.coordinateCount-- ) {
		this.coordinates.push( [ this.x, this.y ] );
	}
	// set a random angle in all possible directions, in radians
	this.angle = random( 0, Math.PI * 2 );
	this.speed = random( 1, 10 );
	// friction will slow the particle down
	this.friction = 0.95;
	// gravity will be applied and pull the particle down
	this.gravity = 1;
	// set the hue to a random number +-20 of the overall hue variable
	this.hue = random( hue - 20, hue + 20 );
	this.brightness = random( 50, 80 );
	this.alpha = 1;
	// set how fast the particle fades out
	this.decay = random( 0.015, 0.03 );
}

// update particle
Particle.prototype.update = function( index ) {
	// remove last item in coordinates array
	this.coordinates.pop();
	// add current coordinates to the start of the array
	this.coordinates.unshift( [ this.x, this.y ] );
	// slow down the particle
	this.speed *= this.friction;
	// apply velocity
	this.x += Math.cos( this.angle ) * this.speed;
	this.y += Math.sin( this.angle ) * this.speed + this.gravity;
	// fade out the particle
	this.alpha -= this.decay;
	
	// remove the particle once the alpha is low enough
	if( this.alpha <= this.decay ) {
		particles.splice( index, 1 );
	}
}

// draw particle
Particle.prototype.draw = function() {
	ctx. beginPath();
	// move to the last tracked coordinates in the set, then draw a line to the current x and y
	ctx.moveTo( this.coordinates[ this.coordinates.length - 1 ][ 0 ], this.coordinates[ this.coordinates.length - 1 ][ 1 ] );
	ctx.lineTo( this.x, this.y );
	ctx.strokeStyle = 'hsla(' + this.hue + ', 100%, ' + this.brightness + '%, ' + this.alpha + ')';
	ctx.stroke();
}

// create particle group/explosion
function createParticles( x, y ) {
	// increase the particle count for a bigger explosion
	var particleCount = 30;
	while( particleCount-- ) {
		particles.push( new Particle( x, y ) );
	}
}

// main demo loop
function loop() {
	// this function will run endlessly with requestAnimationFrame
	requestAnimFrame( loop );
	
	// increase the hue to get different colored fireworks over time
	hue += 0.5;
	
	// setting the composite operation to destination-out clears the canvas at a specific opacity (trail effect)
	ctx.globalCompositeOperation = 'destination-out';
	ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
	ctx.fillRect( 0, 0, cw, ch );
	// lighter creates bright highlight points as the fireworks and particles overlap each other
	ctx.globalCompositeOperation = 'lighter';
	
	// loop over each firework, draw it, update it
	var i = fireworks.length;
	while( i-- ) {
		fireworks[ i ].draw();
		fireworks[ i ].update( i );
	}
	
	// loop over each particle, draw it, update it
	var i = particles.length;
	while( i-- ) {
		particles[ i ].draw();
		particles[ i ].update( i );
	}
	
	// launch fireworks automatically to random coordinates, when the mouse isn't down
	if( timerTick >= timerTotal ) {
		if( !mousedown ) {
			fireworks.push( new Firework( cw / 2, ch, random( 0, cw ), random( 0, ch / 2 ) ) );
			timerTick = 0;
		}
	} else {
		timerTick++;
	}
	
	// limit the rate at which fireworks get launched when mouse is down
	if( limiterTick >= limiterTotal ) {
		if( mousedown ) {
			fireworks.push( new Firework( cw / 2, ch, mx, my ) );
			limiterTick = 0;
		}
	} else {
		limiterTick++;
	}
}

window.onload=function(){
  var merrywrap=document.getElementById("merrywrap");
  var box=merrywrap.getElementsByClassName("giftbox")[0];
  var step=1;
  var stepMinutes=[2000,2000,1000,1000];
  function init(){
          box.addEventListener("click",openBox,false);
  }
  function stepClass(step){
    merrywrap.className='merrywrap';
    merrywrap.className='merrywrap step-'+step;
  }
  function openBox(){
    if(step===1){
      box.removeEventListener("click",openBox,false); 
    }  
    stepClass(step); 
    if(step===3){ 
    } 
    if(step===4){
        reveal();
       return;
    }     
    setTimeout(openBox,stepMinutes[step-1]);
    step++;  
  }
   
  init();
 
}

// ===== Reveal: fireworks + "Happy Birthday Zineb" animation (replaces the YouTube video) =====
function reveal() {
  document.querySelector('.merrywrap').style.backgroundColor = 'transparent';

  // Show the animation container
  const video = document.getElementById('video');
  video.classList.add('active');
  startBirthdayDialogue();

  // Start fireworks
  loop();

  // Create the animation
  video.innerHTML = `
    <div class="zineb-stage">
    <div class="birthday-title">Happy Birthday
      <span id="zineb-word"></span>
    </div>
	</div>
  `;

  const wordEl = document.getElementById('zineb-word');

  const LATIN = 'Zineb';
  const ARABIC = 'زينب';

  const styles = [
    'style-typewriter',
    'style-script',
    'style-bold',
    'style-condensed',
    'style-heirloom',
    'style-display',
    'style-hand',
    'style-mono',
    'style-fun'
  ];

  let lastStyle = null;
  const sequence = [LATIN, ARABIC];
  let step = 0;

  const FADE_OUT = 10;
  const CYCLE = 160;
  const GAP = 15;
  const HOLD = CYCLE - FADE_OUT - GAP;

  function pickStyle() {
    let choice;
    do {
      choice = styles[Math.floor(Math.random() * styles.length)];
    } while (choice === lastStyle);

    lastStyle = choice;
    return choice;
  }

  function nextWord() {
    const text = step < sequence.length
      ? sequence[step++]
      : (Math.random() < 0.5 ? LATIN : ARABIC);

    wordEl.className = pickStyle() +
      (text === ARABIC ? ' arabic' : '');

    wordEl.textContent = text;
    wordEl.style.transitionDuration = '0s';
    wordEl.classList.add('show');

    setTimeout(() => {
      wordEl.style.transitionDuration = FADE_OUT + 'ms';
      wordEl.classList.remove('show');
      setTimeout(nextWord, FADE_OUT + GAP);
    }, HOLD);
  }

  nextWord();
}

function startNames() {
  var LATIN = "Zineb";
  var ARABIC = "زينب";
  var wordEl = document.getElementById('word');

  var styles = [
    'style-typewriter', 'style-script', 'style-bold', 'style-condensed',
    'style-heirloom', 'style-display', 'style-hand', 'style-mono', 'style-fun'
  ];

  var lastStyle = null;
  var step = 0;

  var FADE_OUT = 10;
  var CYCLE = 160;   // total time per word
  var GAP = 15;      // blank pause before next word
  var HOLD = CYCLE - FADE_OUT - GAP;

  function pickStyle() {
    var choice;
    do {
      choice = styles[Math.floor(Math.random() * styles.length)];
    } while (choice === lastStyle);
    lastStyle = choice;
    return choice;
  }

  function nextWord() {
    var  text = Math.random() < 0.5 ? LATIN : ARABIC;

    wordEl.className = pickStyle() + (text === ARABIC ? ' arabic' : '');
    wordEl.textContent = text;

    // appear instantly
    wordEl.style.transitionDuration = '0s';
    wordEl.classList.add('show');

    // disappear almost instantly, then queue the next word
    setTimeout(function () {
      wordEl.style.transitionDuration = FADE_OUT + 'ms';
      wordEl.classList.remove('show');
      setTimeout(nextWord, FADE_OUT + GAP);
    }, HOLD);
  }

  nextWord();
}
let birthdayDialogueStarted = false;

function startBirthdayDialogue() {
  // Prevent the dialogue from starting more than once.
  if (birthdayDialogueStarted) return;

  const overlay = document.getElementById('birthday-dialogue');
  const messageArea = document.getElementById('dialogueMessage');
  const burst = document.getElementById('dialogueBurst');
  const heart = document.getElementById('dialogueHeart');

  if (!overlay || !messageArea || !burst || !heart) {
    console.error('The dialogue HTML is missing or its IDs do not match.');
    return;
  }

  birthdayDialogueStarted = true;

  const messages = [
    "Happy Birthday,l3e9ba lkterr mn 100ans inchaallah.",
	"Filled with joy,happiness and success.",
	"W tkouni flblassa li kat7elmi biha.",
  "W i hope our love lasts until the final goal.",
  "Enjooy ur 18th year.😊"
  ];

  let currentIndex = 0;

  overlay.classList.add('dialogue-visible');

  function createEndingParticle() {
    const particle = document.createElement('div');
    particle.className = 'dialogue-particle';

    const angle = Math.random() * Math.PI * 2;
    const distance = 200 + Math.random() * 400;

    particle.style.setProperty(
      '--x',
      `${Math.cos(angle) * distance}px`
    );

    particle.style.setProperty(
      '--y',
      `${Math.sin(angle) * distance}px`
    );

    overlay.appendChild(particle);

    setTimeout(() => {
      particle.remove();
    }, 2000);
  }

  function showEnding() {
    messageArea.replaceChildren();

    // Show the pink burst and beating heart.
    burst.classList.add('dialogue-burst-active');
    heart.classList.add('dialogue-heart-active');

    // Ending particles only — no background stars.
    for (let i = 0; i < 50; i++) {
      createEndingParticle();
    }

    setTimeout(() => {
      const finalMessage = document.createElement('div');
      finalMessage.className = 'dialogue-final';
      finalMessage.textContent = 'Kanbghik ❤️';

      messageArea.replaceChildren(finalMessage);
    }, 800);
  }

  function showNextMessage() {
    if (currentIndex >= messages.length) {
      showEnding();
      return;
    }

    const line = document.createElement('div');
    line.className = 'dialogue-line';
    line.textContent = messages[currentIndex];

    messageArea.replaceChildren(line);
    currentIndex++;

    // Start the next message after 5 seconds.
    setTimeout(showNextMessage, 5000);
  }

  // Begin shortly after the gift reveal.
  setTimeout(showNextMessage, 500);
}