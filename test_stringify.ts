const questions = [{ id: 1 }];
const stringified = JSON.stringify(questions);
console.log('Frontend sends:', stringified);

const body = { questions: stringified };
console.log('Backend receives body.questions:', body.questions);

const doubleStringified = JSON.stringify(body.questions);
console.log('Backend saves:', doubleStringified);

const parsedOnce = JSON.parse(doubleStringified);
console.log('Frontend receives (parsed once):', parsedOnce);
console.log('Type of parsed once:', typeof parsedOnce);

const parsedTwice = JSON.parse(parsedOnce);
console.log('Parsed twice:', parsedTwice);
console.log('Is Array?', Array.isArray(parsedTwice));
