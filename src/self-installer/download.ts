import fetch from 'node-fetch'
import url from './url'
export const downloadSelfInstaller = () => fetch(url)
export default downloadSelfInstaller
