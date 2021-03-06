(function(){
	var Ext = window.Ext4 || window.Ext;

	var intel_ww = {},
		SECOND = 1000,
		MINUTE = 60*SECOND,
		HOUR = 60*MINUTE,
		DAY = 24*HOUR,
		WEEK = 7*DAY;
		
	Ext.define('IntelWorkweek', {
		/** 
			intel workweek utility module. you can pass in Date objects, strings, or numbers.
			do not pass in Unix UTC millis though, or you will get wrong answer (eg: dont use Date.UTC(...))
		**/
		
		/** calculates intel workweek, returns integer */
		_getWorkweek: function(_date){  //ww1 always contains jan 1st
			var date = new Date(_date),
				yearStart = new Date(date.getFullYear(), 0, 1),
				dayIndex = yearStart.getDay(),
				ww01Start = new Date(yearStart - dayIndex*DAY),
				utcDateMillis = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
				ww01Millis = Date.UTC(ww01Start.getFullYear(), ww01Start.getMonth(), ww01Start.getDate()),
				timeDiff = utcDateMillis - ww01Millis,
				ww = Math.floor(timeDiff/WEEK) + 1,
				leap = (date.getFullYear() % 4 === 0),
				weekCount = ((leap && dayIndex >= 5) || (!leap && dayIndex === 6 )) ? 53 : 52; //weeks in this year
			return weekCount < ww ? 1 : ww;
		},
		
		/** returns the number of intel workweeks in the year the date is in */
		_getWeekCount: function(_date){  // # of intel workweeks in the year the date is in
			var date = new Date(_date),
				leap = (date.getFullYear() % 4 === 0),
				day = new Date(date.getFullYear(), 0, 1).getDay();
			return ((leap && day >= 5) || (!leap && day === 6 )) ? 53 : 52;
		},
		
		_roundDateDownToWeekStart: function(_date){
			var date = new Date(_date),
				day = date.getDay(),
				monthDate = date.getDate(),
				month = date.getMonth(),
				year = date.getFullYear(),
				sundayMidday = new Date(new Date(year, month, monthDate)*1 - (day*DAY - 0.5*DAY)); //daylight savings ._.
			return new Date(sundayMidday.getFullYear(), sundayMidday.getMonth(), sundayMidday.getDate());
		},
		
		/**  gets list of date numbers for each week start between start and end date*/
		_getWorkweekDates: function(startDate, endDate){ //gets list of dates for each week. INCLUSIVE
			var startWeekDate = this._roundDateDownToWeekStart(startDate),
				endWeekDate = this._roundDateDownToWeekStart(endDate),
				startMillis = Date.UTC(startWeekDate.getFullYear(), startWeekDate.getMonth(), startWeekDate.getDate()),
				endMillis = Date.UTC(endWeekDate.getFullYear(), endWeekDate.getMonth(), endWeekDate.getDate()),
				totalWeeks = Math.floor((endMillis - startMillis) / WEEK)+1,
				weeks = new Array(totalWeeks);
			for(var i=0; i<totalWeeks; ++i) {
				var sundayMidday = new Date(startWeekDate*1 + (WEEK*i + HOUR*12));
				weeks[i] = new Date(sundayMidday.getFullYear(), sundayMidday.getMonth(), sundayMidday.getDate());
			}
			return weeks;
		},
		
		_workweekToDate: function(ww, year){ //gets the Date() object of this ww and year
			var yearStart = new Date(year, 0, 1),
				dayIndex = yearStart.getDay(),
				ww01StartMidday = new Date(yearStart - (dayIndex*DAY - 0.5*DAY)),
				sundayMidday = new Date(ww01StartMidday*1 + (ww-1)*WEEK);
			return new Date(sundayMidday.getFullYear(), sundayMidday.getMonth(), sundayMidday.getDate());
		},
		
		_getWorkWeeksForDropdown: function(releaseStartDate, releaseEndDate){ //assumes DropDown uses WorkweekDropdown model
			var workweeks = this._getWorkweekDates(releaseStartDate, releaseEndDate),
				data = new Array(workweeks.length);
			for(var i=0, len=workweeks.length; i<len; ++i){
				data[i] = { 
					Workweek: 'ww' + this._getWorkweek(workweeks[i]),
					DateVal: workweeks[i]*1
				};
			}
			return data;
		}	
	});
}());