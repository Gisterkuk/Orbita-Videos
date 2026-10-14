// Agrega a la música un carril de volumen con fundido de entrada y de salida, SIN tocar
// los carriles que escribió el carve (fx.nX.gain). Correr después de carve.mjs.
//   node scripts/fundido-musica.mjs [index.html] [id=musica]
import fs from 'node:fs'

const [archivo = 'index.html', id = 'musica'] = process.argv.slice(2)
let html = fs.readFileSync(archivo, 'utf8')
const re = new RegExp(`<audio id="${id}"[^>]*>`)
const tag = html.match(re)?.[0]
if (!tag) throw new Error('No encontré <audio id="' + id + '">')
const dur = Number(tag.match(/data-duration="([\d.]+)"/)[1])
const actual = tag.match(/data-automation="([^"]*)"/)
const auto = actual ? JSON.parse(actual[1].replace(/&quot;/g, '"')) : { version: 1, lanes: [] }
auto.lanes = auto.lanes.filter(l => l.target !== 'volume')
auto.lanes.push({ target: 'volume', points: [{ t: 0, v: 0 }, { t: 1.5, v: 1 }, { t: +(dur - 3).toFixed(3), v: 1 }, { t: +dur.toFixed(3), v: 0 }] })
const nuevo = `data-automation="${JSON.stringify(auto).replace(/"/g, '&quot;')}"`
html = html.replace(tag, actual ? tag.replace(actual[0], nuevo) : tag.replace(/>$/, ` ${nuevo}>`))
fs.writeFileSync(archivo, html)
console.log(`${id}: fundido de entrada 1,5 s y de salida 3 s (${auto.lanes.length} carriles)`)
