// utils/quotes.ts

export const quotes = [
  // The Simpsons
  "I am so smart! I am so smart! S-M-R-T! I mean S-M-A-R-T!",
  "D'oh!",
  "Everything's coming up Milhouse!",
  "It’s a perfectly cromulent word.",
  "I, for one, welcome our new insect overlords.",
  "You don’t win friends with salad.",
  "That's unpossible!",
  "My eyes! The goggles do nothing!",
  "I'm in danger.",
  "Me fail English? That's unpossible.",
  "Stupid sexy Flanders.",
  "Hi, Super Nintendo Chalmers!",
  "It's just a little airborne. It's still good, it's still good!",
  "To alcohol! The cause of, and solution to, all of life's problems.",
  "Dental plan! Lisa needs braces.",
  "I'm seeing double here! Four Krustys!",
  "Worst. Episode. Ever.",
  "It smells like Otto's jacket.",
  "Oh, they have the internet on computers now?",
  "I used to be with ‘it’, but then they changed what ‘it’ was. Now what I’m with isn’t ‘it’ anymore and what’s ‘it’ seems weird and scary.",
  "That’s a paddlin’.",
  "In this house, we obey the laws of thermodynamics!",
  "Marge, is Lisa at Camp Granada?",
  "Let's all go out for some frosty chocolate milkshakes!",
  "I call the big one Bitey.",

  // Community
  "Cool. Cool cool cool.",
  "Six seasons and a movie!",
  "I'm streets ahead.",
  "Pop-pop!",
  "Troy and Abed in the morning!",
  "This is the darkest timeline.",
  "I have the weirdest boner.",
  "You're the AT&T of people.",
  "I'll be a living god!",
  "I lived in New York, Troy. I know what a television is.",
  "I need help reacting to something.",
  "It's called a Compliment Sandwich.",
  "We're gonna be a real school again!",
  "I see your value now.",
  "Leonard likes this post.",
  "It's a metaphor. It's a MEEETAPHOOOR!",
  "Britta's the worst. She's a G.D.B.",
  "Would that this hoodie were a time hoodie.",
  "I'm giving you an all-tomato. Meaning you give me the whole tomato, or else.",
  "The gas leak year.",
  "Chaotic good.",
  "What is this, a crossover episode?",
  "I'm a Spanish genius! In español, my nickname is El Tigre Chino.",
  "Some worries are rice.",
  "That's wrinkling my brain."
];

export const getRandomQuote = (): string => {
  return quotes[Math.floor(Math.random() * quotes.length)];
};
