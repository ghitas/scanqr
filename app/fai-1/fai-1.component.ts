import { Component, OnInit, ElementRef, NgZone, ViewChild, AfterViewInit, AfterContentInit, AfterViewChecked, OnDestroy } from '@angular/core';
import { AppService } from '../app.services';
import { Response } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import { Md5 } from '../md5';
import 'rxjs/add/observable/forkJoin';
import '../../assets/js/sdk.js';

declare let PCCMP: any;
const TOKEN = "edca2e1a1fa2bfc0460463fe8fccb31d";
@Component({
	selector: 'app-root',
	templateUrl: './fai-1.component.html'
})
export class fai1Component implements OnInit {
	// the method ngOnInit will run some functions when loading page firstly
	listView: any;
	errorMessage: any;
	zone: NgZone;
	locale: string;
	sheets: any;
	subs: Subscription;
	profile: any;
	json: any;
	promiseNet: any;
	promiseInsertSql: any;
	promiseOnselect: any;
	@ViewChild('listcontent') div: any;
	ngOnInit(): void {
		// when window appear scroll bar, it will run ngAfterViewInit method
		window.onresize = () => {
			this.suAfterViewInit();
		};
		PCCMP.platform.ready().then(() => {
			// start init data...
			this.handleSqliteData();
			PCCMP.user.getProfile().then((result) => {
				this.profile = result;

				this.json = {
					"serviceName": "download",
					"pccUid": this.profile.pccuid,
					"serial": 1,
					"checkSum": "",
					"data": {}
				};
				this.json.checkSum = Md5.hashStr(TOKEN + this.json.serviceName + this.json.pccUid + this.json.serial);
			});
		});
	}
	constructor(
		private elRef: ElementRef,
		private appservice: AppService,
		zone: NgZone
	) {
		this.zone = zone;
		/**
		 * listen message from dialog by services
		 */
		this.subs = appservice.dialogSaid$.subscribe(mess => {
			if (mess.choose === 'yes') {
				switch (mess.yes) {
					case "download": {
						this.handleBtnDownload();
						break;
					}
					case "upload": {
						this.uploadSqliteToEsb('Y');
						break;
					}
					case "delete": {
						this.eraseInvData();
						break;
					}
					case "deleteAll": {
						this.eraseAllInvData();
						break;
					}
					case "close": {
						this.exitProgram();
						break;
					}
				}
			} else if (mess.choose === 'no') {
				switch (mess.yes) {
					case "upload": {
						this.uploadSqliteToEsb('N');
						break;
					}
				}
			} else {
				switch (mess.yes) {
					case "delete": {
						// check permission before			
						this.json.serviceName = "userProfile";
						this.json.checkSum = Md5.hashStr(TOKEN + this.json.serviceName + this.json.pccUid + this.json.serial);
						this.appservice.esb(this.json).subscribe(
							result => {
								if (result.errCode != "000") {
					this.alertError('System error! Please contact customer service!:' + result.errMsg.nm_en);
									return;
								}
								if (result.data.user.del_mk == "Y") {
									this.showPopup("System Information", "Empty the device all inventory data ?", true, "deleteAll", "", "");
								}
							},
							error => this.errorMessage = <any>error
						);
						break;
					}
				}
			}
		});
		this.promiseNet = new Promise((resolve, reject) => {
			PCCMP.platform.getNetInfo().then((result) => {
				if (result != "wifi" && result != "cell") {
					resolve(false);
				} else resolve(true);
			});
		});

	}
	/**
	 * function call services
	 * service call dialog appear
	 */
	showPopup(title: string, content: string, btnYN: boolean, yesFun: string, noFun: string, choose: string) {
		var dialog = {
			title: title,
			content: content,
			btnYN: btnYN,
			access: {
				yes: yesFun,
				no: noFun,
				choose: choose
			}
		};
		this.appservice.faiSay(dialog);
	};
	alertError(mess: string) {
		this.showPopup("Error", mess, false, "none", "none", "none");
	}
	btnDownload() {
		this.showPopup("System Information", "下載後會清空盤點資訊，確定下載?After download Inventory sheet，System will rest inventory record!", true, "download", "", "");
	}
	btnUpload() {
		this.promiseNet.then(result => {
			if (!result) {
				alert('網路未連線! No network connect!');
				return;
			}
		}).catch(error => {
			this.alertError("System error! Please contact customer service! - Network checking error !");
		});
		this.showPopup("System Information", "After upload Inventory sheet , keep inventory record?", true, "upload", "", "");
	}
	btnDelete() {
		this.showPopup("System Information", "Empty all data ?", true, "delete", "", "");
	}
	btnClose() {
		var dialog = {
			title: "System Information",
			content: "Do you want to logout?",
			btnYN: true,
			access: { yes: "close", no: "none", choose: "none" }
		};
		this.appservice.faiSay(dialog);
	}
	/** Remember unsubscribe when routing to another page */
	ngOnDestroy() {
		this.subs.unsubscribe();
	}
	suAfterViewInit() {
		// set the navbar fixed with scroll bar
		let div: any = this.elRef.nativeElement.querySelector('.navbar-fixed-top');
		//set height for div has id = home to show scroll bar when overload height
		let div2: any = this.elRef.nativeElement.querySelector('#home');
		div2.style.height = window.innerHeight - 175 - 12 + "px";
	}
	//
	// Create table if not exists
	// get data from inv_sheets and show in UI
	handleSqliteData() {
		/**
		 * pct change on 16/6/2017
		 * new service download with phan_no's format is number
		 */
		PCCMP.database.sqlBatch([
			'CREATE TABLE IF NOT EXISTS inv_sheets(plan_id INT PRIMARY KEY NOT NULL,plan_no REAL, plan_nm TEXT);',
			'CREATE TABLE IF NOT EXISTS inv_location(location_id REAL PRIMARY KEY NOT NULL,plan_id INT NOT NULL, plan_nm TEXT, location_no TEXT, location_nm_zh_TW TEXT, location_nm_en TEXT);',
			'CREATE TABLE IF NOT EXISTS inv_ast(id INTEGER PRIMARY KEY AUTOINCREMENT, ast_global_id TEXT NOT NULL,location_id REAL NOT NULL, ast_no TEXT NOT NULL, ast_no_bk TEXT, comp_nm TEXT, ast_nm_zh_tw TEXT, ast_nm_en TEXT, style_no TEXT, brand_nm TEXT, pur_date_fact TEXT, idle_mk TEXT, keeper_nm TEXT);',
			'CREATE TABLE IF NOT EXISTS inv_parameter(no TEXT PRIMARY KEY NOT NULL,nm_zh_tw TEXT NOT NULL, nm_en TEXT NOT NULL);',
			'CREATE TABLE IF NOT EXISTS inv_checked(id INTEGER, ast_global_id TEXT, ast_no TEXT NOT NULL, plan_id INT NOT NULL, location_id REAL NOT NULL, inv_checker TEXT, memo TEXT, idle_mk TEXT, manual TEXT, upload_date TEXT, checked_date TEXT, attr_update_date TEXT);'
		])
			.then((results) => {
				this.onSelect();
				this.promiseOnselect.then(result => {
				}).catch(error => {
					this.alertError("System error! Please contact customer service! - promise InsertSQL error !");
				});
			}).catch((error) => {
				this.alertError('isTableExist: ' + JSON.stringify(error));
			});
	}
	handleBtnDownload() {
		/** Check network connection status */
		this.promiseNet.then(result => {
			if (!result) {
				alert('網路未連線! No network connect!');
				return;
			}
		}).catch(error => {
			this.alertError("System error! Please contact customer service! - Network checking error !");
		});
		/** end check network */
		this.listView = '';

		PCCMP.database.sqlBatch([
			'CREATE TABLE IF NOT EXISTS inv_sheets(plan_id INT PRIMARY KEY NOT NULL,plan_no REAL, plan_nm TEXT);',
			'DELETE from inv_sheets;',
			'CREATE TABLE IF NOT EXISTS inv_location(location_id REAL PRIMARY KEY NOT NULL,plan_id INT NOT NULL, plan_nm TEXT, location_no TEXT, location_nm_zh_TW TEXT, location_nm_en TEXT);',
			'DELETE from inv_location;',
			'CREATE TABLE IF NOT EXISTS inv_ast(id INTEGER PRIMARY KEY AUTOINCREMENT, ast_global_id TEXT NOT NULL,location_id REAL NOT NULL, ast_no TEXT NOT NULL, ast_no_bk TEXT, comp_nm TEXT, ast_nm_zh_tw TEXT, ast_nm_en TEXT, style_no TEXT, brand_nm TEXT, pur_date_fact TEXT, idle_mk TEXT, keeper_nm TEXT);',
			'DELETE from inv_ast;',
			'CREATE TABLE IF NOT EXISTS inv_parameter(no TEXT PRIMARY KEY NOT NULL,nm_zh_tw TEXT,nm_en TEXT);',
			'DELETE from inv_parameter;',
			'CREATE TABLE IF NOT EXISTS inv_checked(id INTEGER, ast_global_id TEXT, ast_no TEXT NOT NULL, plan_id INT NOT NULL, location_id REAL NOT NULL, inv_checker TEXT, memo TEXT, idle_mk TEXT, manual TEXT, upload_date TEXT, checked_date TEXT, attr_update_date TEXT);',
			'DELETE from inv_checked where inv_checker = "' + this.profile.login + '";'
		])
			.then((results) => {
				this.doDownload();
				this.json.serviceName = "basicData";
				this.json.checkSum = Md5.hashStr(TOKEN + this.json.serviceName + this.json.pccUid + this.json.serial);
				this.appservice.esb(this.json).subscribe(
					result => {
						if (result.errCode != "000") {
					this.alertError('System error! Please contact customer service!:' + result.errMsg.nm_en);
							return;
						}
						let res = result.data.config.data;
						let sqlInsert = [];
						for (let i = 0; i < res.length; i++) {
							sqlInsert.push('insert into inv_parameter(no, nm_zh_tw, nm_en) values("' + res[i].no + '", "' + res[i].nm_zh_TW + '", "' + res[i].nm_en + '")');
						}
						PCCMP.database.sqlBatch(sqlInsert)
							.then((results) => {

							}).catch((error) => {
								this.alertError('error when run sqlBatch (create and delete table): ' + JSON.stringify(error));
							});
					},
					error => { this.alertError('get basic data fail! ' + <any>error); },
					() => { this.listView = this.listView }
				);
			}).catch((error) => {
				this.alertError('error when run sqlBatch (create and delete table): ' + JSON.stringify(error));
			});
	}
	doDownload() {
		this.json.serviceName = "download";
		this.json.checkSum = Md5.hashStr(TOKEN + this.json.serviceName + this.json.pccUid + this.json.serial);
		this.appservice.esb(this.json).subscribe(
			result => {
				if (result.errCode != "000") {
					this.alertError('System error! Please contact customer service!:' + result.errMsg.nm_en);
					return;
				}
				if (result.data == "") {
					this.showPopup('System information', '沒有盤點清單!No Inventory sheet!', false, "", "", "");
					return;
				}
				/** convert object to array */
				let arr = [];
				let lol = [];
				let axe = [];
				if (result.data.inv.length == undefined) {
					arr.push(result.data.inv);
				} else {
					arr = result.data.inv;
				}
				for (var i = 0; i < arr.length; i++) {
					if (arr[i].loc.length == undefined) {
						lol.push(arr[i].loc);
						arr[i].loc = lol;
						lol = [];
					}
					for (var j = 0; j < arr[i].loc.length; j++) {
						if (arr[i].loc[j].ast.length == undefined) {
							axe.push(arr[i].loc[j].ast);
							arr[i].loc[j].ast = axe;
							axe = [];
						}
					}
				}
				//this.listView = arr;
				/* end convert */
				if (arr.length > 0) {
					this.onInsert(arr);
					this.promiseInsertSql.then(result => {
						if (result) {
							this.onSelect();
							this.promiseOnselect.then(result => {
								this.showPopup('System information', '下載完畢!Download Complete!', false, "", "", "");
							}).catch(error => {
								this.alertError("System error! Please contact customer service! - promise InsertSQL error !");
							});
						} else this.alertError("System error! Please contact customer service! - promise InsertSQL error !");
					}).catch(error => {
						this.alertError("System error! Please contact customer service! - promise InsertSQL error !");
					});
				}
				else { this.alertError("沒有盤點清單!No Inventory sheet!"); return; }
			},
			error => { this.alertError('下載失敗!Download Fail! ' + <any>error); },
			() => { this.listView = this.listView }
		);
	}
	// insert data into inv_sheets, inv_location, inv_ast when click download
	onInsert = (res: any): void => {
		this.promiseInsertSql = new Promise((resolve, reject) => {
			const db = PCCMP.database;
			let inv = res;
			for (let i = 0; i < inv.length; i++) {
				// insert data into table inv_sheets
				db.executeSql('insert into inv_sheets (plan_id, plan_no, plan_nm) values(' + inv[i].plan_id + ', "' + inv[i].plan_no + '", "' + inv[i].plan_nm + '")')
					.then((results) => {
						console.log('insert inv_sheets success');
					}).catch((error) => {
						this.alertError('Insert into inv_sheets fail: ' + JSON.stringify(error));
					});
				for (let l = 0; l < inv[i].loc.length; l++) {
					// insert data into table inv_location
					db.executeSql('insert into inv_location (location_id, plan_id, plan_nm, location_no, location_nm_zh_TW, location_nm_en) values(' + inv[i].loc[l].location_id + ', ' + inv[i].plan_id + ', "' + inv[i].plan_nm + '", "' + inv[i].loc[l].location_no + '", "' + inv[i].loc[l].location_nm_zh_TW + '", "' + inv[i].loc[l].location_nm_en + '")')
						.then((results2) => {
							console.log('insert inv_location success');
						}).catch((error) => {
							this.alertError("insert into inv_location fail: " + JSON.stringify(error));
						});
					let ast = inv[i].loc[l].ast;
					for (let a = 0; a < ast.length; a++) {
						// insert data into table inv_ast
						db.executeSql('insert into inv_ast (ast_global_id, location_id, ast_no, ast_no_bk, comp_nm, ast_nm_zh_tw, ast_nm_en, style_no, brand_nm, pur_date_fact, idle_mk, keeper_nm) values("' + ast[a].ast_global_id + '", ' + inv[i].loc[l].location_id + ', "' + ast[a].ast_no + '",  "' + ast[a].ast_no_bk + '", "' + ast[a].comp_nm + '", "' + ast[a].ast_nm_zh_TW + '", "' + ast[a].ast_nm_en + '", "' + ast[a].style_no + '", "' + ast[a].brand_nm + '", "' + ast[a].pur_date_fact + '", "' + ast[a].idle_mk + '", "' + ast[a].keeper_nm + '")')
							.then((results2) => {
								if (a == ast.length - 1) resolve(true);
							}).catch((error) => {
								this.alertError("insert into inv_ast fail: " + JSON.stringify(error));
								reject();
							});
					}
				}
			}
		});
	}
	onSelect(): void {
		this.promiseOnselect = new Promise((resolve, reject) => {
			this.listView = [];
			// get locale
			PCCMP.user.getLocale()
				.then((data) => {
					this.locale = data;

				}).then((locale) => {
					/**
					 * formula
					 * to do = total inventory - checked
					 * checked = count all from checked where plan_id = current inv_sheets
					 * extras = count all from checked where assets not exists in inventory assets				
					 */
					this.appservice.locale = this.locale != "" ? this.locale.substr(0, 2) : "en";
					PCCMP.database
						.executeSql(
						'select *,(select count(*) from inv_ast ia, inv_sheets ish, inv_location il where ish.plan_id = il.plan_id and il.location_id = ia.location_id and ish.plan_id = inv_sheets.plan_id and id NOT IN (select c.id from inv_checked c, inv_ast a where c.id = a.id and c.plan_id = inv_sheets.plan_id)) todo,(select count(*) from inv_checked c, inv_ast a where c.id = a.id and c.plan_id = inv_sheets.plan_id) checked, (select count(*) from inv_checked c where (c.id = "" or c.id is NULL) and c.plan_id = inv_sheets.plan_id) extras from inv_sheets;'
						)
						.then((res) => {
							for (let i = 0; i < res.rows.length; i++) {
								this.listView.push({ "plan_id": res.rows[i].plan_id, "plan_no": res.rows[i].plan_no, "plan_nm": res.rows[i].plan_nm, "todo": res.rows[i].todo, "checked": res.rows[i].checked, "extras": res.rows[i].extras });
								if(i == res.rows.length-1) resolve(true);
							}
						}).catch((error) => {
							this.alertError('System error! Please contact customer service! - OnSelect');
							reject();
						});
				});
		});
	}
	// set data for FAL2
	setDataFal2(plan_id) {
		this.appservice.tmp = plan_id;
	}

	// erase inventory data
	eraseInvData() {
		// Check network connection
		this.promiseNet.then(result => {
			if (!result) {
				this.alertError("網路未連線! No network connect!");
				return;
			}
		}).catch(error => {
			this.alertError("System error! Please contact customer service! - Network checking error !");
		});

		PCCMP.database.sqlBatch([
			'DELETE from inv_sheets;',
			'DELETE from inv_location;',
			'DELETE from inv_ast;',
			'DELETE from inv_parameter;',
			'DELETE from inv_checked where inv_checker = "' + this.profile.login + '";'
		]).then(() => {
			this.listView = [];
			this.showPopup("System information", "資料已刪除!/Reset Complete!", false, "delete", "", "");
		}).catch((error) => {
			this.alertError('System error! Please contact customer service! - Delete error !');
		});
	}

	eraseAllInvData() {
		PCCMP.database.sqlBatch([
			'DELETE from inv_sheets;',
			'DELETE from inv_location;',
			'DELETE from inv_ast;',
			'DELETE from inv_parameter;',
			'DELETE from inv_checked;'
		]).then(() => {
			this.listView = [];
			this.showPopup("System information", "Reset all inventory data Complete!", false, "", "", "");
		}).catch((error) => {
			this.alertError('System error! Please contact customer service! - Delete error !');
		});
	}

	uploadSqliteToEsb(confirm) {
		let upload = [];
		const promiseT = new Promise(function (resolve, reject) {
			PCCMP.database
				.executeSql(
				'select plan_id from inv_checked where upload_date is NULL GROUP BY plan_id;'
				)
				.then((sheets) => {
					if (sheets.rowsLength == 0) {
						resolve(0);
					}
					// loop of sheets list
					(function loop(i) {
						const promise = new Promise((resolve, reject) => {
							// restore isCheckSheets is false every inventory
							let isCheckSheets = false;
							PCCMP.database
								.executeSql('select location_id from inv_checked where plan_id = ' + sheets.rows[i].plan_id + ' and upload_date is NULL GROUP BY location_id')
								.then((locs) => {
									// loop of location list
									(function loop(l) {
										const promise = new Promise((resolve, reject) => {
											// reset ast list every location item
											let new_ast = [];
											PCCMP.database
												.executeSql('select c.* from inv_checked c where c.location_id =' + locs.rows[l].location_id + ' and c.upload_date is NULL')
												.then((asts) => {
													/**
													 * Loop of assets list
													 * push all ast detail to new_ast
													 */
													for (let a = 0; a < asts.rows.length; a++) {
														new_ast.push({ "ast_global_id": asts.rows[a].ast_global_id, "ast_no": asts.rows[a].ast_no, "idle_mk": asts.rows[a].idle_mk, "memo": asts.rows[a].memo, "timemillis": asts.rows[a].checked_date });
													}
													if (!isCheckSheets) {
														upload.push({ "plan_id": sheets.rows[i].plan_id, "loc": [{ "location_id": locs.rows[l].location_id, "ast": new_ast }] });
														isCheckSheets = true;
													} else {
														upload[i].loc.push({ "location_id": locs.rows[l].location_id, "ast": new_ast });
													}
													resolve(); // resolve it! ES7 format
												})
												.catch((error) => {
													this.alertError('error upload - get list inv_checked - location: ' + JSON.stringify(error));
												});
										}).then(() => l >= locs.rows.length - 1 || loop(l + 1))
											.then(() => {
												l == locs.rows.length - 1 && resolve(); // resolve it! ES7 format
											});
									})(0);
								})
								.catch((error) => {
									this.alertError('error upload - get list inv_location: ' + JSON.stringify(error));
								});
						}).then(() => !(i >= sheets.rows.length - 1 || loop(i + 1)) || resolve(upload))
					})(0);
				})
				.catch((error) => {
					this.alertError('error upload - get list inv_sheets: ' + JSON.stringify(error));
					reject();
				});
		});
		promiseT.then(result1 => {
			// Use result1
			if (result1 == 0)
				this.showPopup("System information", "No inventory sheet to upload!", false, "", "", "");
			else
				return this.callEsbUpload(result1, confirm); // (A)
		}).catch(error => {
			// Handle errors of asyncFunc1() and asyncFunc2()
		});
	}

	callEsbUpload(data, confirm) {
		this.json.data.inv = data;
		this.json.serviceName = "upload";
		this.json.checkSum = Md5.hashStr(TOKEN + this.json.serviceName + this.json.pccUid + this.json.serial);
		this.appservice.esb(this.json).subscribe(
			result => {
				if (result.errCode != "000") {
					this.alertError('System error! Please contact customer service!:' + result.errMsg.nm_en);
					return;
				}
				if (confirm == "Y") {
					let date = new Date();
					PCCMP.database.executeSql('update inv_checked set upload_date = "' + date.getTime() + '" where upload_date is NULL')
						.then((result_update) => {
						}).catch((error) => {
							this.alertError('System error! Please contact customer service!');
						});
				} else {
					PCCMP.database.executeSql('DELETE from inv_checked where inv_checker = "' + this.profile.login + '"')
						.then((result_delete) => {
							for (let i = 0; i < this.listView.length; i++) {
								this.listView[i].todo = this.listView[i].todo + this.listView[i].checked;
								this.listView[i].checked = 0;
								this.listView[i].extras = 0;
							}
						}).catch((error) => {
							this.alertError('System error! Please contact customer service!');
						});
				}
				if (result.errCode == "000")
					this.showPopup("System information", "Upload Complete", false, "", "", "");
			},
			error => alert(JSON.stringify(error))
		);
	}

	exitProgram() {
		PCCMP.platform.exit().then(() => {
			// start exit...			
		});
	}

}

