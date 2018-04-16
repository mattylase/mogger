#!/usr/bin/env node

var http = require('http')
var requestify = require('requestify')
var fs = require('fs')

const [, , ...args] = process.argv
const acceptedArguments = ['--url', '--cookie', '--requestMethod', '--className', '--saveLocation', '--ext']
let url, className, cookie, saveLocation, ext = 'ts', requestMethod = 'get'

args.forEach((value) => {
  parseArgument(value)
})

if (requestMethod === 'get') {
  requestify.get(url, {
    cookies: {
      'medcompass-cookie-auth': 'cookie value'
    }
  })
    .then(response => {
      exportResponse(response.body)
  }).catch(e => {
    console.log(e)
  })
}

// Parse the actual command line arguments
function parseArgument(rawArgument) {
  const parts = rawArgument.split("=")
  console.log(parts)
  const arg = parts[0]
  const value = parts[1]
  if (acceptedArguments.includes(parts[0])) {
    url = '--url' === arg ? value : url 
    requestMethod = '--requestMethod' === arg ? value : requestMethod 
    className = '--className' === arg ? value : className 
    saveLocation = '--saveLocation' === arg ? value : saveLocation 
    ext = '--ext' === arg ? value : ext 
    cookie = '--cookie' === arg ? value : cookie 
  } else {
    throw new Error(`Illegal argument provided: ${parts[0]}`)
  }
}

// Export to a file
function exportResponse(body) {
  if (!saveLocation) {
    throw new Error(`A --saveLocation must be provided`)
  }

  if (!className) {
    throw new Error('A --className must be provided')
  }

  const cleanedBody = cleanBodyString(body)
  const heading = `export const ${className} = \n`
  const ending = '\n'

  const fileContents = heading + cleanedBody + ending
  const fullyQualifiedPath = saveLocation + '/' + className + '.' + ext 
  console.log(fullyQualifiedPath)
  fs.writeFileSync(fullyQualifiedPath, fileContents)
}

function cleanBodyString(body) {
  let cleanedBody = ''

  const bodyParts = body.split(/,/)
  bodyParts.forEach(part => {
    if (part.trim() !== '}' || part.trim() !== '{') {
      const keyValue = part.split(':')
      if (keyValue.length < 2) {
        cleanedBody += `${keyValue[0]},\n`
      } else {
        keyValue[0] = keyValue[0].replace(/"/g, '')
        if (keyValue.length > 2) {
          for (var i = 2; i < keyValue.length; i++) {
            keyValue[1] += `:${keyValue[i]}`
          }
        }
        cleanedBody += `${keyValue[0]}: ${keyValue[1]},\n`
      }
    }
  })

  cleanedBody = cleanedBody.substring(0, cleanedBody.lastIndexOf(','))

  return cleanedBody
}