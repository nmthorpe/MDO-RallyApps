(function(){
	var Ext = window.Ext4 || window.Ext;
	
	/** YOU MUST PASS IT 2 THINGS IN THE CONFIG
		1: releases (array of release records)
		2: currentRelease (what to show as initial value
	*/
	Ext.define('IntelReleasePicker', {
		extend: 'IntelFixedComboBox',
		alias: ['widget.intelreleasepicker'],
		
		constructor: function(options){
			if(!options.releases || !options.currentRelease) return;
			
			options.displayField = 'Name';
			options.value = options.currentRelease.data.Name;
			options.store = Ext.create('Ext.data.Store', {
				fields: ['Name'],
				data: _.map(options.releases, function(r){ return {Name: r.data.Name }; })
			});
			
			options.fieldLabel = options.fieldLabel || 'Release:';
			options.editable = options.editable || false;
			options.width = options.width || 240;
			options.labelWidth = options.labelWidth || 50;
			
			this.callParent([options]); //now that we have the extra stuff added
		}
	});
}());
