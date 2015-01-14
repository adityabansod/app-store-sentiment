var natural = require('natural'),
    tfidf = natural.TfIdf,
    csv = require('csv'),
    fs = require('fs');

var reviews = [];
var tfidfs = [];
var classifier = new natural.BayesClassifier();

setupClassifer()
readCsv(__dirname+'/ios_review_sample3.csv');

function setupClassifer() {
	var goodwords = ['love', 'good', 'great', 'awesome', 'quick', 'nice', 'best', 'awesome', 'slick', 'lifesaver', 'impressive', 'thanks', 'helpful', 'easy', 'simple'];
	var badwords = ['crash', 'cmon', 'error', 'wont', 'cant', 'invalid', 'lazy', 'not', 'bs', 'stopped', 'worse', 'annoying', 'worst', 'terrible', 'bug'];
	classifier.addDocument(goodwords, 'good');
	classifier.addDocument(badwords, 'bad');
	classifier.train();	
}

function readCsv(filename) {
	fs.createReadStream(filename).pipe(csv.parse()).pipe(csv.transform(function(row) {     
		parseRow(row);
	    // handle each row before the "end" or "error" stuff happens above
	})).on('readable', function() {
		while(this.read()) {/*chew the stream*/}
	}).on('end', function() {
	    // yay, end
	    processTfidf();
	}).on('error', function(error) {
	    // oh no, error
	    console.log('err')
	});
}

function parseRow(row) {
    if(row.length == 9) {
    	if(parseInt(row[7])) {
    		// we have a well formed row now
    		var review = row[1] + ' ' + row[6],
    			appid = 'ios' + row[7];
    		if(reviews[appid] == null) {
    			reviews[appid] = [];
    		} 
    		reviews[appid].push(review);
    	}
    }
}

function processTfidf()
{
	for(var appid in reviews) {
		var appreviews = reviews[appid];
		console.log('creating new tfidf for ' + appid + ' with ' + appreviews.length + ' reviews');
		tfidfs[appid] = new tfidf();
		var good = 0, bad = 0;
		for (var i = 0; i < appreviews.length; i++) {
			tfidfs[appid].addDocument(appreviews[i]);
			switch (classifier.classify(appreviews[i])) {
				case 'good':
					good++; 
					break;
				case 'bad':
					bad++;
					break;
			}
		}
		var terms = tfidfs[appid].listTerms(0 /*document index*/);
		for (var i = 0; i < terms.length && i < 3; i++) {
		    console.log('\t' + terms[i].term + ': ' + terms[i].tfidf);
		}
		console.log('\t' + parseInt((bad/(bad+good)*100)) + '% bad reviews');
	}
}