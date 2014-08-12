/**
 * 
 */

var mike = mike || {};

/** namespace for Mike's hacks */
mike.tempreport = mike.tempreport || {};

mike.tempreport.site = "innsbruck";
mike.tempreport.hours = 8;
mike.tempreport.labels = [];


// probe reads 1000*degrees centigrade.  Convert this to farenheit, but only with
// a 2 decimal precision
function farh(temp) {
	  return Number((32.0 + temp * 9.0 / 5000.0).toFixed(2));
}

function getLabel(i) {
	if (mike.tempreport.labels instanceof Array && i < mike.tempreport.labels.length) {
		return mike.tempreport.labels[i];
	}
	return ("Label" + i);
}

mike.tempreport.print = function(message) {
	document.getElementById('message_div').innerHTML = message;
}

mike.tempreport.clearnodes = function(node) {
	while (node.hasChildNodes()) {
		node.removeChild(node.lastChild);
	}
}

mike.tempreport.clear = function() {
	document.getElementById('message_div').innerHTML = "";
	mike.tempreport.clearnodes(document.getElementById('chart_div'));
	mike.tempreport.clearnodes(document.getElementById('gauge_div'));
}

// Callback functions
// Get the labels.
mike.tempreport.setLabels = function(resp) {
	mike.tempreport.labels = resp.labels;
}


// Get the line chart data.  If this succeeds, get the gauge data
mike.tempreport.getChartData = function(resp) {
	var readings = resp.readings;

	// see if there's any data return
	if (readings instanceof Array && readings.length > 0) {
		// if there is, create the new data table and fill it in
	    var data = new google.visualization.DataTable();
	    data.addColumn('datetime', 'Date');
	    for (i = 0; i < readings[0].temps.length; i++) {
	    	data.addColumn('number', getLabel(i));
	    }
	    for (i = 0; i < readings.length; i++) {
	    	var row = [new Date(readings[i].date)];
	    	for (j = 0; j < readings[i].temps.length; j++) {
	    		row.push(farh(readings[i].temps[j]));
	    	}
	    	data.addRow(row);
	    }
	    // save to use later
	    mike.tempreport.data = data;
	}
	else {
		// Otherwise, report no chart data
    	mike.tempreport.print("No Chart Data");
	}
    // kick off the gauge read
	gapi.client.tempreport.tempreading.getReading({'site': mike.tempreport.site}).execute(mike.tempreport.getGaugeData);
}    
 
// get the gauge data.  If this succeeds, draw the charts
mike.tempreport.getGaugeData = function(resp) {
	// check to see if there's any data
	if (resp.temps instanceof Array && resp.temps.length > 0) {
		// If so, create the datatable and fill it in
	    var gaugeData = new google.visualization.DataTable();
	    gaugeData.addColumn('string', 'Label');
	    gaugeData.addColumn('number', 'Value');
	    for (i = 0; i < resp.temps.length; i++) {
	    	row = [getLabel(i)];
	    	row.push(farh(resp.temps[i]));
	    	gaugeData.addRow( row );
	    }
	    mike.tempreport.gaugeData = gaugeData;
	} 
	else {
		// If not, tag no line data
    	mike.tempreport.print("No Data");
	}
    
    // now draw the charts
    mike.tempreport.drawCharts();
}

// clear the current screen, graph the reading
mike.tempreport.showTemps = function() {
	// clear the screen and null out existing data
	mike.tempreport.clear();
	mike.tempreport.data = null;
	mike.tempreport.gaugeData = null;
	
	// first get the labels
	gapi.client.tempreport.tempreading.getLabel({'site': mike.tempreport.site}).execute(mike.tempreport.setLabels);
	
	// get the chart data.  This will kick off the gauge data, then call the method to draw charts
	gapi.client.tempreport.tempreading.readings({'site': mike.tempreport.site, 'hours': mike.tempreport.hours}).execute(mike.tempreport.getChartData)
}

mike.tempreport.drawCharts = function() {
    var options = {
       title: 'Time vs Temp',
       height: 400
    };
    var chart = new google.visualization.LineChart(document.getElementById('chart_div'));

    var gaugeOptions = {
    	  	minorTicks: 5,
    	  	height: 200, width: 400,
    	  	min: -20, max: 150
        };
    var gaugechart = new google.visualization.Gauge(document.getElementById('gauge_div'));

    // if we have data, draw that charts.  If not, data methods will have already reported no data
    if (mike.tempreport.gaugeData != null) {
    	gaugechart.draw(mike.tempreport.gaugeData, gaugeOptions);
    }
    if (mike.tempreport.data != null) {
    	chart.draw(mike.tempreport.data, options);
    }
}


// add the javascript to the buttons.  Change the site, number of hours, and refresh
mike.tempreport.enableButtons = function() {
	  document.getElementById('home').onclick = function() {
		  mike.tempreport.site = "td-home";
		  mike.tempreport.showTemps();
	  }
	  document.getElementById('innsbruck').onclick = function() {
		  mike.tempreport.site = "innsbruck";
		  mike.tempreport.showTemps();
	  }
	  document.getElementById('h24').onclick = function() {
		  mike.tempreport.hours = 24;
		  mike.tempreport.showTemps();
	  }
	  document.getElementById('h12').onclick = function() {
		  mike.tempreport.hours = 12;
		  mike.tempreport.showTemps();
	  }
	  document.getElementById('h8').onclick = function() {
		  mike.tempreport.hours = 8;
		  mike.tempreport.showTemps();
	  }
	  document.getElementById('h4').onclick = function() {
		  mike.tempreport.hours = 4;
		  mike.tempreport.showTemps();
	  }
	  document.getElementById('h2').onclick = function() {
		  mike.tempreport.hours = 2;
		  mike.tempreport.showTemps();
	  }
}


/**
 * Initializes the application.
 * @param {string} apiRoot Root of the API's path.
 */
mike.tempreport.init = function(apiRoot) {
	// loads tempreport api, triggers drawchart when done
	
  var apisToLoad;
  var callback = function() {
    if (--apisToLoad == 0) {
    	mike.tempreport.enableButtons();
    	if (mike.tempreport.vizinitialized) {
  		  mike.tempreport.showTemps();
    	}
    }
  }

  apisToLoad = 1; // must match number of calls to gapi.client.load()
  gapi.client.load('tempreport', 'v1', callback, apiRoot);
};
