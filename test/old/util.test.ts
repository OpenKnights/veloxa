import { mergeRequestOptions, transformGetParams } from '../../src/utils'

test('Was GEI request parameter processed?', () => {
  let getUrl = 'http://www.test.com'
  const getParams = {
    name: 'King-3',
    age: 18,
    ids: [36, 20, 3]
  }

  getUrl += `?${transformGetParams(getParams)}`
  expect(getUrl).toEqual(
    'http://www.test.com?name=King-3&age=18&ids%5B0%5D=36&ids%5B1%5D=20&ids%5B2%5D=3'
  )
})

test('Did the request options merge successfully?', () => {
  const config = {
    baseURL: 'http://localhost:3068',
    headers: {
      Apploction: 'test Token'
    }
  }
  const options = {
    url: '/testDelay',
    method: 'GET',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  }

  const { input, init } = mergeRequestOptions(config, options)

  expect(input).toEqual('http://localhost:3068/testDelay')
  expect(init.headers!.Apploction).toEqual('test Token')
  expect(init.headers!['Content-Type']).toEqual(
    'application/x-www-form-urlencoded'
  )
})
