(function(window, createjs, opspark, _) {

  // Variable declarations for libraries and the game engine
  const
    draw = opspark.draw, // library for drawing using createJS
    physikz = opspark.racket.physikz, // library for defining physics properties like velocity
    engine = opspark.V6().activateResize(), // game engine for actively rendering + running the game's mechanics
    canvas = engine.getCanvas(), // object for referencing the height / width of the window
    stage = engine.getStage(); // object to hold all visual components

  // load some sounds for the demo - play sounds using: createjs.Sound.play("wall");
  createjs.Sound.on("fileload", handleLoadComplete);
  createjs.Sound.alternateExtensions = ["mp3"];
  createjs.Sound.registerSounds([{ src: "hit.ogg", id: "hit" }, { src: "wall.ogg", id: "wall" }], "assets/sounds/");

  function handleLoadComplete(event) {
    console.log('sounds loaded');
  }

  engine
    .addTickHandlers(update) // establish the update function as the callback for every timer tick
    .activateTick();

  // Variable declarations for the paddles and the ball which are drawn using createJS (see bower_components/opspark-draw/draw.js)
  const
    paddlePlayer = createPaddle(),
    paddleCPU = createPaddle({ x: canvas.width - 20, y: canvas.height - 100 }),
    ball = draw.circle(20, '#CCC'),
    //declarations for txtScore the variables that create the text that show the scores.
    txtScoreP = createText(0, canvas.width/2 - 10, 10),
    txtScoreCPU = createText(0, canvas.width/2 + 10, 10);
  //declarations for the variables that hold the scores. I couldn't put them in the update function otherwise they'd be 0 every update.
  let scoreP = 0,
      scoreCPU = 0;

  // set initial properties for the paddles 
  paddlePlayer.yVelocity = 0;
  paddleCPU.yVelocity = 6;

  // set initial properties for the ball
  ball.x = canvas.width / 2;
  ball.y = canvas.height / 2;
  ball.xVelocity = 5;
  ball.yVelocity = 5;

  // add the paddles and the ball to the view
  stage.addChild(paddlePlayer, paddleCPU, ball, txtScoreP, txtScoreCPU);


  document.addEventListener('keyup', onKeyUp);
  document.addEventListener('keydown', onKeyDown);

  // when an Arrow key is pressed down, set the paddle in motion
  function onKeyDown(event) {
    if (event.key === 'ArrowUp') {
      paddlePlayer.yVelocity = -5;
    } else if (event.key === 'ArrowDown') {
      paddlePlayer.yVelocity = 5;
    }
  }

  // when either the Arrow Up or Arrow Down key are released, stop the paddle from moving
  function onKeyUp(event) {
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      paddlePlayer.yVelocity = 0;
    }
  }
  function update(event) {
    const
      boundsCPU = paddleCPU.getBounds(),
      widthCPU = boundsCPU.width,
      heightCPU = boundsCPU.height,
      midCPU = heightCPU / 2,
      boundsPlayer = paddlePlayer.getBounds(),
      widthPlayer = paddlePlayer.width,
      heightPlayer = paddlePlayer.height;

    // Ball movement: the xVelocity and yVelocity is the distance the ball moves per update
    ball.x = ball.x + ball.xVelocity;
    ball.y = ball.y + ball.yVelocity;

    // Player movement //
    paddlePlayer.y += paddlePlayer.yVelocity;
    if (paddlePlayer.y < 0) {
      paddlePlayer.y = 0;
    }
    if (paddlePlayer.y > canvas.height - paddlePlayer.height) {
      paddlePlayer.y = canvas.height - heightPlayer;
    }

    // AI movement: CPU follows ball //
    //Compares the paddle to the ball and then chooses to move up or down based on that comparison.
    //The line paddleCPU.y + midCPU takes the middle of paddle to be compared to the ball.
    //The line ball.y - 14 determines the spot on the ball that the CPU compares to the paddle.
    if ((paddleCPU.y + midCPU) < (ball.y - 14 )) {
      paddleCPU.y += paddleCPU.yVelocity;
    } else if ((paddleCPU.y + midCPU) > (ball.y + 14)) {
      paddleCPU.y -= paddleCPU.yVelocity;
    }

    // TODO 1: bounce the ball off the top
    if (ball.y < 0 + ball.height) {
      ball.yVelocity = -1 * ball.yVelocity;
      createjs.Sound.play("wall");
    }

    // TODO 2: bounce the ball off the bottom
    if (ball.y > canvas.height - (ball.height / 2)) {
      ball.yVelocity = -1 * ball.yVelocity;
      createjs.Sound.play("wall");
    }

    // TODO 3: bounce the ball off each of the paddles
    function Collide(paddle, ball) {
      //sets up the ball and paddle in an array so I can just use a loop to type less.
      var parameters = [paddle, ball];
      //Inside the loop I give both the ball and the paddle variables that store the position of their top, bottom, left, and right sides.
      for (let i = 0; i < 2; i++) {
        parameters[i].top = parameters[i].y - (parameters[i].height * (0.5 * i)) //had to write an extra bit of math because the ball's x,y coords were centered, not in the top left of the ball.
        parameters[i].left = parameters[i].x - (parameters[i].height * (0.5 * i)) //This math allows the left and top coords to be top left for the ball while not effecting the paddle's left and top coords.
        parameters[i].bottom = parameters[i].top + parameters[i].height
        parameters[i].right = parameters[i].left + parameters[i].width
      }
      //If the ball's top is below the paddle's, the ball's bottom is above the paddle's, the ball's left is to the right of the paddle's, and the ball's right is to the right of the paddle's then the ball changes direction.
      //In other words, if the ball touches the paddle the ball changes it's horizontal direction.
      if (ball.bottom > paddle.top && ball.top < paddle.bottom && ball.left < paddle.right && ball.right > paddle.left) {
        ball.xVelocity = ball.xVelocity * -1;
        createjs.Sound.play("hit");
      }
    }
    //Calls function for both the CPU and player
    Collide(paddleCPU, ball);
    Collide(paddlePlayer, ball);

    //"TODO 4": Scoring and resetting the ball.
    //If the player scores they get a point and the ball resets.
    if (ball.x > canvas.width) {
      //score player (variable that holds score is assigned to the text property of the appropriate score textfield.)
      scoreP += 1
      txtScoreP.text = scoreP
      //ball reset (ball is reset to initial position.)
      ball.x = canvas.width / 2;
      ball.y = canvas.height / 2;
      ball.xVelocity = 5;
      ball.yVelocity = 5;
    }
    //If the ai scores they get a point and the ball resets.
    if (ball.x < 0) {
      //score ai
      scoreCPU = scoreCPU + 1
      txtScoreCPU.text = scoreCPU;
      //ball reset
      ball.x = canvas.width / 2;
      ball.y = canvas.height / 2;
      ball.xVelocity = 5;
      ball.yVelocity = 5;
    }
  }
  
  //helper function that makes it easy to create textfields.
  function createText(text, x, y) {
    const t = draw.textfield(text);
    t.x = x;
    t.y = y;
    return t;
  }
  // helper function that wraps the draw.rect function for easy paddle making
  function createPaddle({ width = 20, height = 100, x = 0, y = 0, color = '#CCC' } = {}) {
    const paddle = draw.rect(width, height, color);
    paddle.x = x;
    paddle.y = y;
    return paddle;
  }


}(window, window.createjs, window.opspark, window._));
