/** this app is used to configure the scrum-groups and portfolio locations in the workspace **/
(function(){
	var Ext = window.Ext4 || window.Ext;
	
	Ext.define('ScrumGroupPortfolioConfiguration', {
		extend: 'IntelRallyApp',
		mixins:[
			'WindowListener',
			'PrettyAlert',
			'IframeResize'
		],

		/************************************************** UTIL FUNCS **********************************************/
		_getStoreData: function(){
			var me=this;
			return _.map(me.ScrumGroupConfig, function(scrumGroupConfig){
				return {
					ScrumGroupRootProjectOID: scrumGroupConfig.ScrumGroupRootProjectOID || 0,
					ScrumGroupName: scrumGroupConfig.ScrumGroupName || '',
					ScrumGroupAndPortfolioLocationTheSame: scrumGroupConfig.ScrumGroupAndPortfolioLocationTheSame ? true : false,
					PortfolioProjectOID: scrumGroupConfig.PortfolioProjectOID || 0,
					IsTrain: scrumGroupConfig.IsTrain ? true : false
				};
			});
		},
		
		/******************************************************* LAUNCH ********************************************************/	
		launch: function(){
			var me = this;
			me._initDisableResizeHandle();
			me._initFixRallyDashboard();
			me.setLoading('Loading Configuration');
			if(!me.getContext().getPermissions().isWorkspaceOrSubscriptionAdmin(me.getContext().getWorkspace())) { //permission check
				me.setLoading(false);
				me._alert('ERROR', 'You do not have permissions to edit this workspace\'s settings!');
				return;
			} 
			me._configureIntelRallyApp()
				.then(function(){ return me._loadAllProjects(); })
				.then(function(allProjects){
					me.AllProjects = allProjects;
					me.ProjectDataForStore = _.sortBy(_.map(me.AllProjects, 
						function(project){ return { Name: project.data.Name, ObjectID: project.data.ObjectID}; }),
						function(item){ return item.Name; });
					me.setLoading(false);
					me._renderGrid();
				})
				.fail(function(reason){
					me.setLoading(false);
					me._alert('ERROR', reason || '');
				})
				.done();
		},

		/************************************************************* RENDER *******************************************/
		_renderGrid: function(){
			var me = this;
			
			me.ScrumGroupPortfolioConfigStore = Ext.create('Ext.data.Store', { 
				model:'ScrumGroupPortfolioConfigItem',
				data: me._getStoreData()
			});

			var columnCfgs = [{
				text:'Scrum Group Root Project',
				dataIndex:'ScrumGroupRootProjectOID',
				tdCls: 'intel-editor-cell',	
				flex:1,
				editor:{
					xtype:'intelcombobox',
					width:'100%',
					allowBlank:true,
					store: Ext.create('Ext.data.Store', {
						fields: ['Name', 'ObjectID'],
						data: me.ProjectDataForStore
					}),
					displayField: 'Name',
					valueField: 'ObjectID'
					
				},			
				resizable:false,
				draggable:false,
				sortable:true,
				renderer:function(pid){ 
					if(!pid) return '-';
					else return me.AllProjects[pid].data.Name;
				}
			},{
				text:'Scrum Group Name', 
				dataIndex:'ScrumGroupName',
				tdCls: 'intel-editor-cell',	
				flex:1,
				editor: 'textfield',
				resizable:false,
				draggable:false,
				sortable:true
			},{
				text:'Scrum Group And Portfolio Location The Same?', 
				xtype:'checkcolumn',
				dataIndex:'ScrumGroupAndPortfolioLocationTheSame',
				flex:1,
				resizable:false,
				draggable:false,
				sortable:true
			},{
				text:'Portfolio Project',
				dataIndex:'PortfolioProjectOID',
				flex:1,
				editor:{
					xtype:'intelcombobox',
					width:'100%',
					allowBlank:true,
					store: Ext.create('Ext.data.Store', {
						fields: ['Name', 'ObjectID'],
						data: me.ProjectDataForStore
					}),
					displayField: 'Name',
					valueField: 'ObjectID'
				},			
				resizable:false,
				draggable:false,
				sortable:true,
				renderer:function(pid, meta, record){
					if(!record.data.ScrumGroupAndPortfolioLocationTheSame) meta.tdCls += ' intel-editor-cell';
					if(record.data.ScrumGroupAndPortfolioLocationTheSame || !pid) return '-';
					else return me.AllProjects[pid].data.Name;
				}
			},{
				text:'Is Train?', 
				xtype:'checkcolumn',
				dataIndex:'IsTrain',
				width: 100,
				resizable:false,
				draggable:false,
				sortable:true
			},{
				text:'',
				width:160,
				xtype:'fastgridcolumn',
				tdCls: 'iconCell',
				resizable:false,
				draggable:false,
				renderer: function(value, meta, record){
					return {
						xtype:'button',
						text:'Remove Scrum Group',
						width:'100%',
						handler: function(){ me.ScrumGroupPortfolioConfigStore.remove(record); }
					};
				}
			}];

			me.ScrumGroupPortfolioConfigGrid = me.add({
				xtype: 'grid',
				emptyText: ' ',
				header: {
					layout: 'hbox',
					items: [{
						xtype:'text',
						cls:'grid-header-text',
						width:500,
						text:"Scrum Group Portfolio Config"
					},{
						xtype:'container',
						flex:1000,
						layout:{
							type:'hbox',
							pack:'end'
						},
						items:[{
							xtype:'button',
							text:'+ Add Scrum Group',
							width:150,
							margin:'0 10 0 0',
							listeners:{
								click: function(){
									var model = Ext.create('ScrumGroupPortfolioConfigItem', {
										ScrumGroupRootProjectOID: 0,
										ScrumGroupName: '',
										ScrumGroupAndPortfolioLocationTheSame: true,
										PortfolioProjectOID: 0,
										IsTrain: true
									});
									me.ScrumGroupPortfolioConfigStore.insert(0, [model]);
								}
							}
						},{
							xtype:'button',
							text:'Undo changes',
							width:110,
							margin:'0 10 0 0',
							listeners:{
								click: function(){
									me.ScrumGroupPortfolioConfigStore.removeAll();
									me.ScrumGroupPortfolioConfigStore.add(me._getStoreData());
								}
							}
						},{
							xtype:'button',
							text:'Save Config',
							width:100,
							listeners:{ 
								click: function(){
									var scrumGroupRecords = me.ScrumGroupPortfolioConfigStore.getRange(),
										scrumGroupData = _.map(scrumGroupRecords, function(scrumGroupRecord){
											return {
												ScrumGroupRootProjectOID: scrumGroupRecord.data.ScrumGroupRootProjectOID,
												ScrumGroupName: scrumGroupRecord.data.ScrumGroupName,
												ScrumGroupAndPortfolioLocationTheSame: scrumGroupRecord.data.ScrumGroupAndPortfolioLocationTheSame,
												PortfolioProjectOID: scrumGroupRecord.data.PortfolioProjectOID,
												IsTrain: scrumGroupRecord.data.IsTrain
											};
										}),
										badScrumGroupRootOID = _.find(scrumGroupData, function(scrumGroupConfig){
											if(!scrumGroupConfig.ScrumGroupRootProjectOID) return true;
										}),
										badPortfolioOID = _.find(scrumGroupData, function(scrumGroupConfig){
											if(!scrumGroupConfig.ScrumGroupAndPortfolioLocationTheSame && !scrumGroupConfig.PortfolioProjectOID) return true;
										}),
										badScrumGroupName = _.find(scrumGroupData, function(scrumGroupConfig){
											if(!scrumGroupConfig.ScrumGroupName) return true;
										}),
										conflictingScrumGroupProject = _.find(scrumGroupData, function(scrumGroup1, idx1){
											return _.some(scrumGroupData, function(scrumGroup2, idx2){
												return idx1 !== idx2 && scrumGroup1.ScrumGroupRootProjectOID && 
													(scrumGroup1.ScrumGroupRootProjectOID == scrumGroup2.ScrumGroupRootProjectOID);
											});
										}),
										conflictingScrumGroupName = _.find(scrumGroupData, function(scrumGroup1, idx1){
											return _.some(scrumGroupData, function(scrumGroup2, idx2){
												return idx1 !== idx2 && scrumGroup1.ScrumGroupName === scrumGroup2.ScrumGroupName;
											});
										});
										
									/***************** run data integrity checks before saving *************************/
									if(badScrumGroupRootOID) 
										me._alert('ERROR', 'You must select a valid Scrum Group Root Project!');
									else if(badPortfolioOID) 
										me._alert('ERROR', 'You must select a valid Portfolio Project!');
									else if(badScrumGroupName) 
										me._alert('ERROR', 'Found an invalid Scrum Group Name!');
									else if(conflictingScrumGroupProject) 
										me._alert('ERROR', 'A project is used for more than 1 Scrum Group!');
									else if(conflictingScrumGroupName) 
										me._alert('ERROR', 'A Name is used by more than 1 Scrum Group!');
									else {
										me.ScrumGroupPortfolioConfigGrid.setLoading('Saving Config');
										me._saveScrumGroupConfig(scrumGroupData)
											.fail(function(reason){ me._alert(reason); })
											.then(function(){ me.ScrumGroupPortfolioConfigGrid.setLoading(false); })
											.done();
									}
								}
							}
						}]
					}]
				},
				margin:'10px 0 0 0',
				height:600,
				scroll:'vertical',
				columns: columnCfgs,
				disableSelection: true,
				plugins: [Ext.create('Ext.grid.plugin.CellEditing', { clicksToEdit: 1 })],
				viewConfig:{
					stripeRows:true,
					preserveScrollOnRefresh:true
				},
				listeners: {
					beforeedit: function(editor, e){
						var record = e.record,
							field = e.field;
						return (field != 'PortfolioProjectOID') || !record.data.ScrumGroupAndPortfolioLocationTheSame;
					},
					edit: function(editor, e){
						var field = e.field,
							value = e.value,
							originalValue = e.originalValue,
							record = e.record;
						if(field == 'ScrumGroupName' && value != originalValue) record.set('ScrumGroupName', value.trim());
					}
				},
				showRowActionsColumn:false,
				showPagingToolbar:false,
				enableEditing:false,
				store: me.ScrumGroupPortfolioConfigStore
			});	
		}
	});
}());