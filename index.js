var fs = require('fs')
var path = require('path')
var csv = require('csv')
var system = require('cb-system')
var moment = require('moment')

var HARVEST_DATE_FORMAT = 'MM/DD/YYYY' // Silly Americans.
var INVADM_DATE_FORMAT = 'YYYY-MM-DD'  // Sortable.

var first = true
function processChunk(chunk) {
  if (first) {
    first = false
    return
  }

  var issueDate = moment.utc(chunk[0], HARVEST_DATE_FORMAT)
  var lastPayment = chunk[1] ? moment.utc(chunk[1], HARVEST_DATE_FORMAT) : null
  var id = chunk[2]
  var to = chunk[4]
  // Harvest exports amounts with thousand delimeters.
  var amount = parseFloat(chunk[6].replace(',', ''), 10)
  var paid = chunk[7].replace(',', '')
  var currency = chunk[13].slice(-3)

  var invoice = {
    id: id,
    to: to,
    net: net,
    from: from,
    amount: amount,
    payments: lastPayment ? [{ amount: amount, date: lastPayment.format(INVADM_DATE_FORMAT) }] : [],
    'issue-date': issueDate.format(INVADM_DATE_FORMAT),
    currency: currency,
  }

  console.log(JSON.stringify(invoice, null, 2))
  fs.writeFile(path.join(out, id + '.json'), JSON.stringify(invoice), function (err) {
    if (err) console.error('error writing invoice ' + id)
  })
}

var parser = csv.parse()
var from = process.argv[2]
var net = parseInt(process.argv[3], 10)
var out = process.argv[4]

if (!from || isNaN(net) || !out) {
  console.error('usage: harvest-csv-to-invadm <from> <net> <output-directory> < harvest.csv')
  process.exit(1)
}

process.stdin.pipe(parser)
parser.on('readable', function () {
  var chunk
  while ((chunk = parser.read()) !== null)
    processChunk(chunk)
})
