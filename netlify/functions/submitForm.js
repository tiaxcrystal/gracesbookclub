exports.handler = async function(event, context) {
  console.log("Form submitted!", event.body);
  return {
    statusCode: 200,
    body: "Form received!"
  };
};
