// This file is managed through github at https://github.com/ckhordiasma/log-bullet-visitors/ using github actions.

const AWS = require('aws-sdk');

const dynamo = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event, context) => {
    //console.log('Received event:', JSON.stringify(event, null, 2));

    let body;
    let statusCode = '200';
    
    const allowedOrigins = ["https://af-vcd.github.io", "https://ea-pods-team.github.io", "https://ckhordiasma.github.io"];

    // this logic allows me to have multiple allowed origins
    let allowedOrigin = allowedOrigins[0];
    for(let origin of allowedOrigins){
        if(event.headers.origin == origin){
            allowedOrigin = origin;
        }    
    }
    
    const headers = {
        'Content-Type': 'application/json',
        "Access-Control-Allow-Headers":"*",
        "Access-Control-Allow-Origin": allowedOrigin,
        "Access-Control-Allow-Methods":"POST,GET,OPTIONS"
    };
    
    if(! event.headers.origin){
        statusCode = '400';
        body = "Error - No origin specified in request";

        return {statusCode, body, headers};
    }

    const routeSuffix = ' /LogVisitors';
    
    // I routed OPTIONS seperately in the API gateway, so that the routekey shows up as 'OPTIONS /LogVisitors'
    //  and can route a happy status accordingly.
    if(event.routeKey == 'OPTIONS' + routeSuffix){
        return {
            statusCode,
            body,
            headers
        }
    }
    
    // Also custom routed GET and POST in the same way as OPTIONS. This has the nice
    //  security feature of only allowing GET, POST, and OPTIONS into my lambda through the API gateway.
    
    const WEEK_MS = 1000*60*60*24*7;
    
    const countParams = {
        TableName:'Statistics',
        Select: "COUNT",
        KeyConditionExpression: "#date between :start_date and :end_date",
        ExpressionAttributeNames: {
            "#date": "Date",
        },
        ExpressionAttributeValues: {
             ":start_date": Date.now()-WEEK_MS,
             ":end_date": Date.now() 
        }
    };
    
    try {
        switch (event.routeKey) {
            case 'GET' + routeSuffix:
                const result = await dynamo.query(countParams).promise();
                body = {Count: result.Count }
                break;
            case 'POST' + routeSuffix:
                const timestamp = new Date().getTime();
                
                //defining StatsID to be VisitLog_timestamp_RANDOMNUMBER
                const params = {
                    TableName : 'Statistics',
                    Item: {
                        "StatsID": 'VisitLog' + '_' + timestamp + '_' + Math.floor(Math.random()*1024),
                        "Date": timestamp,
                        "Site": event.headers.referer
                    }
                }
                await dynamo.put(params).promise();
                
                body = await dynamo.scan(countParams).promise();
                break;
            default:
                throw new Error(`Unsupported method "${event.routeKey}"`);
        }
    } catch (err) {
        statusCode = '400';
        body = err.message;
    } finally {
        body = JSON.stringify(body);
    }

    return {
        statusCode,
        body,
        headers,
    };
};
