#!/usr/bin/env node

const http = require('http')
const requestify = require('requestify')
const fs = require('fs')
const conf = require('./mogger.conf')


const [, , ...args] = process.argv
const acceptedArguments = ['--url', '--cookie', '--request-method', '--class-name', '--save-location', '--ext']
let url, className, cookie, saveLocation, ext = 'ts', requestMethod = 'get'

args.forEach((value) => {
  parseArgument(value)
})

if (requestMethod === 'get') {
  requestify.get(url, conf.cookie).then(response => {
      exportResponse(response.body)
  }).catch(e => {
    console.error(e)
  })
} else if (requestMethod === 'post') {
  requestify.post(url, conf.body, conf.cookie).then(response => {
      exportResponse(response.body)
  }).catch(e => {
    console.error(e)
  })
}

// Parse the actual command line arguments
function parseArgument(rawArgument) {
  const parts = rawArgument.split("=")
  const arg = parts[0]
  if (parts.length > 2) {
    for (var i = 2; i < parts.length; i++) {
      parts[1] += '=' + parts[i]
    }
  }
  const value = parts[1]
  if (acceptedArguments.includes(parts[0])) {
    url = '--url' === arg ? value : url 
    requestMethod = '--request-method' === arg ? value : requestMethod 
    className = '--class-name' === arg ? value : className 
    saveLocation = '--save-location' === arg ? value : saveLocation 
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
        keyValue[0] = keyValue[0].trim()
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