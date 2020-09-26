# log-bullet-visitors

This is some simple server-side javascript code that I intend to use to track visitors to the various versions of the AF bullet tracking tool: 
- [ea-pods-team.github.io/pdf-bullets](https://ea-pods-team.github.io/pdf-bullets)
- [af-vcd.github.io/pdf-bullets](https://af-vcd.github.io/pdf-bullets)
- [ckhordiasma.github.io/pdf-bullets](https://ckhordiasma.github.io/pdf-bullets)

## Privacy
 
I am only tracking timestamps of visits and which URL was visited (i.e. ea-pods-team or af-vcd, etc). Not going to track IP addresses of visitors, not even user-agent strings. 
 
 The primary reason why I created a github repository to manage this
 lambda function in the first place (as opposed to managing it in AWS console) was to make it very
 transparent what user information I am tracking. If you don't believe what I'm claiming, you can inspect the code and see for yourself.

## Implementation

This was my first time using AWS API Gateway, AWS Lambda, and AWS DynamoDB, so it definitely was a big learning experience for me. If I did anything egregiously wrong/poorly, 
please submit an issue or otherwise contact me and let me know.

### AWS

I started off by creating a lambda function on the AWS. I created a new role for the for the lambda, with write access to CloudWatch Logs (don't think I'm using this) 
and read/write access to DynamoDB (definitely using this). I think I ended up using a template that included some boilerplate code for DynamoDB access.

Next I went to the DynamoDB site and created a created a table with a single partition key. I created some test rows so I could check if GET/POST was working in the lambda function.

Back to the lambda function: I set request headers to enable CORS (see the code), but it wasn't working as expected for the boilerplate code. After some trial and error, I managed 
to get it working via use of routes the AWS API Gateway and CORS handled manually in the lambda function.

The API gateway was initially configured for the lambda function after I created it. The gateway has some CORS capabilities, but 
I could not get it to work, I was getting errors like "http not ok" and the typical CORS error messages. Instead of using API Gateway CORS, I turned it off and 
instead replaced the ANY route with three allowed routes: OPTIONS, GET, and POST. I set all three to routes to point to the lambda function, which seems redundant, but was 
actually important because otherwise I couldn't easily distinguish between GET, POST, and OPTIONS requests in my lambda function. 

Once I got that working, it was relatively easy to set up the DynamoDB getting and setting through some googling and reading the [dynamodb documentclient documentation](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html)

### Github

I primarily used the guide [here](https://blog.jakoblind.no/aws-lambda-github-actions/) to figure out how to integrate the AWS lambda function with github. I had to run `npm init` and `npm install aws-sdk` in order to auto-generate `package.json` and 
`package-lock.json`, but otherwise went very smoothly. For the AWS credentials, I created a new user with only lambda permissions, trying to follow least priviledge principles.
