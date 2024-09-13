// Get canvas element and context
var canvas = document.getElementById('wheelCanvas');
var ctx = canvas.getContext('2d');

// Variables for the wheel
var names = [];
var startAngle = 0;
var arc = 0;
var spinTimeout = null;
var spinTime = 0;
var spinTimeTotal = 0;

// Variables for spinning animation
var totalRotation = 0;
var initialStartAngle = 0;

// Rigged winner variables
var isRigging = false;
var riggedWinner = '';
var riggedInput = '';

document.getElementById('updateWheelBtn').addEventListener('click', updateWheel);
document.getElementById('spinBtn').addEventListener('click', spin);

// Event listener for detecting spacebar and capturing rigged winner name
document.addEventListener('keydown', function(event) {
  // If focus is on an input field, ignore
  if (document.activeElement.tagName.toLowerCase() === 'textarea' || document.activeElement.tagName.toLowerCase() === 'input') {
    return;
  }

  if (event.code === 'Space') {
    event.preventDefault(); // Prevent default spacebar scrolling
    if (!isRigging) {
      // Start rigging mode
      isRigging = true;
      riggedInput = '';
      console.log('Enter the rigged winner\'s name and press space to confirm.');
    } else {
      // Confirm rigged winner
      isRigging = false;
      riggedWinner = riggedInput.trim();
      if (riggedWinner !== '') {
        console.log('Rigged winner set to: ' + riggedWinner);
      } else {
        console.log('Rigged winner cleared.');
      }
    }
  } else if (isRigging) {
    // Capture input for rigged winner name
    riggedInput += event.key;
  }
});

// Function to update the wheel with names
function updateWheel() {
  var input = document.getElementById('namesInput').value;
  names = input.split(',').map(function(name) {
    return name.trim();
  }).filter(function(name) {
    return name !== '';
  });
  startAngle = 0; // Reset the start angle
  drawWheel();

  // Save names to localStorage
  localStorage.setItem('wheelNames', JSON.stringify(names));
}

// Function to draw the wheel
function drawWheel() {
  var outsideRadius = 200;
  var textRadius = 160;
  var insideRadius = 0;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (names.length === 0) {
    // If no names are available, display a message
    ctx.font = 'bold 24px Arial';
    ctx.fillStyle = 'black';
    ctx.fillText('No names available!', canvas.width / 2 - ctx.measureText('No names available!').width / 2, canvas.height / 2);
    return;
  }

  var numSegments = names.length;
  arc = Math.PI / (numSegments / 2);

  for (var i = 0; i < numSegments; i++) {
    var angle = startAngle + i * arc;
    ctx.fillStyle = getColor(i, numSegments);

    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, canvas.height / 2);
    ctx.arc(canvas.width / 2, canvas.height / 2, outsideRadius, angle, angle + arc, false);
    ctx.lineTo(canvas.width / 2, canvas.height / 2);
    ctx.fill();

    ctx.save();
    ctx.fillStyle = "white";
    ctx.translate(
        canvas.width / 2 + Math.cos(angle + arc / 2) * textRadius,
        canvas.height / 2 + Math.sin(angle + arc / 2) * textRadius
    );
    ctx.rotate(angle + arc / 2 + Math.PI / 2);
    var text = names[i];
    ctx.font = 'bold 15px Arial';
    ctx.fillText(text, -ctx.measureText(text).width / 2, 0);
    ctx.restore();
  }

  // Draw arrow pointing down at the top of the wheel
  ctx.fillStyle = "black";
  ctx.beginPath();
  ctx.moveTo(canvas.width / 2 - 10, canvas.height / 2 - (outsideRadius + 20));
  ctx.lineTo(canvas.width / 2 + 10, canvas.height / 2 - (outsideRadius + 20));
  ctx.lineTo(canvas.width / 2, canvas.height / 2 - (outsideRadius + 10));
  ctx.closePath();
  ctx.fill();
}

// Function to generate colors for the wheel segments
function getColor(item, maxitem) {
  var hue = item * (360 / maxitem);
  return 'hsl(' + hue + ', 100%, 50%)';
}

// Function to start spinning the wheel
function spin() {
  if (names.length === 0) {
    alert("No names available to spin!");
    return;
  }

  spinTime = 0;
  spinTimeTotal = 5000; // Total spin time in milliseconds
  initialStartAngle = startAngle;

  var rotations = Math.floor(Math.random() * 3) + 3; // 3 to 5 rotations

  if (riggedWinner) {
    var winnerIndex = names.indexOf(riggedWinner);
    if (winnerIndex === -1) {
      alert('Rigged winner "' + riggedWinner + '" not found in the names list.');
      riggedWinner = ''; // Clear the rigged winner
    } else {
      var desiredAngle = (winnerIndex) * arc + (arc / 2);
      desiredAngle = desiredAngle % (2 * Math.PI);

      var currentAngle = (startAngle + Math.PI / 2) % (2 * Math.PI); // Adjust for arrow at 90 degrees

      var angleDifference = (desiredAngle - currentAngle + 2 * Math.PI) % (2 * Math.PI);

      totalRotation = rotations * 2 * Math.PI + angleDifference;
    }
  } else {
    totalRotation = rotations * 2 * Math.PI + Math.random() * 2 * Math.PI;
  }

  rotateWheel();
}

// Function to rotate the wheel
function rotateWheel() {
  spinTime += 30;
  if (spinTime >= spinTimeTotal) {
    startAngle = initialStartAngle + totalRotation;
    stopRotateWheel();
    return;
  }

  var t = spinTime / spinTimeTotal;
  var easedT = easeOut(t);

  startAngle = initialStartAngle + easedT * totalRotation;

  drawWheel();
  spinTimeout = setTimeout(rotateWheel, 30);
}

// Function to stop the wheel and display the selected name
function stopRotateWheel() {
  clearTimeout(spinTimeout);

  var degrees = startAngle * 180 / Math.PI + 90; // Adjust for arrow at 90 degrees
  var arcd = arc * 180 / Math.PI;
  var index = Math.floor((360 - (degrees % 360)) / arcd) % names.length;

  var text = names[index];
  document.getElementById('result').innerText = "Congratulations! The winner is " + text + "!";

  // Clear the rigged winner after spinning
  riggedWinner = '';
}

// Easing function for spin animation
function easeOut(t) {
  return 1 - Math.pow(1 - t, 3);
}

// Load names from localStorage on page load
window.onload = function() {
  var storedNames = localStorage.getItem('wheelNames');
  if (storedNames) {
    names = JSON.parse(storedNames);
    document.getElementById('namesInput').value = names.join(', ');
    startAngle = 0;
    drawWheel();
  } else {
    // Initial draw if no names are in localStorage
    drawWheel();
  }
}
