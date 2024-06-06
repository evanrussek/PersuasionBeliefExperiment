  // this should go somewhere else
  // Define a function to generate random stick lengths
  function generateRandomStickLengths(N_Sticks, max_length, min_length) {
    var lengths = [];
    for (var i = 0; i < N_Sticks; i++) {
      lengths.push(Math.floor(Math.random() * max_length) + min_length); // Random length between 20 and 120
    }
    
    lengths.sort(function(a, b) { return a - b; }); // Sort lengths in ascending order

    return lengths;
  }