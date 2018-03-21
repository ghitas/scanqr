import { Component, ElementRef, NgZone, OnDestroy } from '@angular/core';
import { Routes, Router } from '@angular/router';
import { AppService } from '../app.services';
import { Subscription } from 'rxjs/Subscription';

declare var PCCMP: any;
@Component({
	selector: 'app-root',
	templateUrl: './fai-3.component.html'
})
export class fai3Component {
	zone: NgZone;
	assetsNo: string;
	assetsNoTxt: string;
	assetsNmTxt: string;
	oldAssetsNoTxt: string;
	tabObj = { todo: 0, checked: 0, extras: 0 };
	user: any;
	extrasModal: any;
	compModal: any;
	listCompany: any[];
	// the method ngOnInit will run some functions when loading page firstly
	subs = new Subscription;
	ngOnInit(): void {
		//alert(this.date.getFullYear()+''+this.date.getUTCMonth()+''+this.date.getDate());
		this.extrasModal = this.elRef.nativeElement.querySelector('#btnCtrlModal');
		this.compModal = this.elRef.nativeElement.querySelector('#btnCtrlComp');
		this.onSelect();
	}

	ngOnDestroy() {
		this.subs.unsubscribe();
	}
	constructor(private router: Router, private elRef: ElementRef, zone: NgZone, private appservice: AppService) {
		this.zone = zone;
		this.subs = appservice.dialogSaid$.subscribe(mess => {
			if (mess.choose === "yes") {
				this.confirmYesExtras();
			}
			if (mess.choose === "no") {
				this.confirmNoExtras();
			}
		});
	}
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
	/**
   * Remember use the ES6 arrow function.
   */
	barcodeScanHandler = (data: string): void => {
		console.log(new Date().toISOString());
		this.zone.run(() => {
			this.handleafterScanQrcode(data);
		});
	}

	openBarcodeScanner(): void {
		PCCMP.camera.openBarcodeScanner(this.barcodeScanHandler);
	}
	closeBarcodeScanner(): void {
		PCCMP.camera.closeBarcodeScanner();
	}
	// get location & open barcode - camera
	onSelect(): void {
		this.openBarcodeScanner();
		// get user profile
		PCCMP.user.getProfile().then((res) => {
			this.user = res;
		}).catch((error) => {
			this.alertError("error when get user profile :" + JSON.stringify(error));
		});
		/**
		 * Count todo , checked, extras to show in tabs
		 */
		PCCMP.database.executeSql('select (select count(*) from inv_ast where location_id=' + this.appservice.selectedLoc.location_id + ' and id NOT IN (select c.id from inv_checked c, inv_ast a where c.id = a.id)) todo, (select count(*) from inv_checked c, inv_ast a where c.id = a.id and c.location_id =' + this.appservice.selectedLoc.location_id + ') checked, (select count(*) from inv_checked c where (c.id = "" or c.id is NULL) and c.location_id = ' + this.appservice.selectedLoc.location_id + ') extras')
			.then((results) => {
				this.tabObj = { todo: results.rows[0].todo, checked: results.rows[0].checked, extras: results.rows[0].extras };
			}).catch((error) => {
				this.alertError('get sqlite data fail : ' + JSON.stringify(error));
			});
	}
	// handling back button
	handleBackBtn() {
		this.router.navigate(['/fai2']);
	}
	/**
	 * handle insert assets when scan QR code
	 */
	handleafterScanQrcode(data) {
		data = data.toUpperCase();
		var soundExtras = this.elRef.nativeElement.querySelector('#beep2');
		var soundSuccess = this.elRef.nativeElement.querySelector('#beep1');
		let res = data.split(",");
		if (res[1] == undefined) {
			this.assetsNo = data;
			// play two beep mean scan Assets belong this location
			soundExtras.play();
			this.showPopup("System Information", "Is extra item?", true, "", "", "");
			return;
		}
		PCCMP.database.executeSql('select *, count(*) num from inv_ast a, inv_location l, inv_sheets s where s.plan_id = l.plan_id and  a.location_id = l.location_id and s.plan_id = ' + this.appservice.tmp + ' and l.location_id = ' + this.appservice.selectedLoc.location_id + ' and UPPER(a.ast_no) = UPPER("' + res[1] + '") and UPPER(a.ast_global_id) = UPPER("' + res[0] + '")')
			.then((results) => {
				if (results.rows[0].num > 0) {
					// play one beep mean scan Assets belong this location
					soundSuccess.play();
					PCCMP.database.executeSql('select *, count(*) count_ast from inv_checked c where c.plan_id = ' + this.appservice.tmp + ' and c.location_id = ' + this.appservice.selectedLoc.location_id + ' and UPPER(c.ast_no) = UPPER("' + res[1] + '") and UPPER(c.ast_global_id) = UPPER("' + res[0] + '")')
						.then((result_count) => {
							// Check assets insert only 1
							if (result_count.rows[0].count_ast == 0) {
								let ast = results.rows[0];
								// call function to insert into inv_checked
								this.insertInv_checked(ast);
							} else {
								// // call function to insert into inv_checked : post: checked_date
								this.assetsNoTxt = res[1];
								this.assetsNmTxt = results.rows[0].ast_nm_zh_tw + "" + results.rows[0].ast_nm_en;
								this.oldAssetsNoTxt = results.rows[0].ast_no_bk;
								this.updateInv_checked(results.rows[0].id);
							}
						}).catch((error) => {
							this.alertError('search asset_no in inventory fail: ' + JSON.stringify(error));
						});
				} else {
					this.assetsNo = data;
					// play two beep mean scan Assets belong this location
					soundExtras.play();
					this.showPopup("System Information", "Is extra item?", true, "", "", "");
				}
			})
			.catch(() => {

			});
	}
	/**
	 * handle insert assets when manual input
	 */
	handleInputAst() {
		if (this.appservice.selectedLoc.location_id == undefined)
			this.alertError("Need to select location first !");
		else if (this.assetsNo != "" && this.assetsNo != undefined) {
			this.assetsNo = this.assetsNo .toUpperCase();
			PCCMP.database.executeSql('select * from inv_ast a, inv_location l, inv_sheets s where s.plan_id = l.plan_id and a.location_id = l.location_id and s.plan_id = ' + this.appservice.tmp + ' and l.location_id = ' + this.appservice.selectedLoc.location_id + ' and UPPER(a.ast_no) = UPPER("' + this.assetsNo + '")')
				.then((results) => {
					/**
					 * Check asset exists in inventory list
					 * if exists => insert value format : checked
					 */
					if (results.rowsLength == 1) {
						PCCMP.database.executeSql('select *,count(*) count_ast from inv_checked c where c.plan_id = ' + this.appservice.tmp + ' and c.location_id = ' + this.appservice.selectedLoc.location_id + ' and UPPER(c.ast_no) = UPPER("' + this.assetsNo + '")')
							.then((result_count) => {
								// Check assets insert only 1
								if (result_count.rows[0].count_ast == 0) {
									// call function to insert into inv_checked
									this.insertInv_checked(results.rows[0]);
								} else {
									// // call function to insert into inv_checked : post: checked_date
									this.updateInv_checked(results.rows[0].id);
									this.assetsNoTxt = results.rows[0].ast_no;
									this.assetsNmTxt = results.rows[0].ast_nm_zh_tw + "" + results.rows[0].ast_nm_en;
									this.oldAssetsNoTxt = results.rows[0].ast_no_bk;
								}
							}).catch((error) => {
								this.alertError('search asset_no in inventory fail: ' + JSON.stringify(error));
							});
					} else if (results.rowsLength > 1) {

						this.listCompany = results.rows;
						this.compModal.click();
					} else {
						this.showPopup("System Information", "Is extra item?", true, "", "", "");
					}
				}).catch((error) => {
					this.alertError('search asset_no in inventory fail: ' + JSON.stringify(error));
				});
		} else {
			this.alertError("please input Asset No !");
		}
	}
	insertInv_checked(ast) {
		let date = new Date();
		PCCMP.database.executeSql('insert into inv_checked(id, ast_global_id, ast_no, plan_id, location_id, inv_checker, memo, idle_mk, checked_date, attr_update_date) values(' + ast.id + ',"' + ast.ast_global_id + '", "' + ast.ast_no + '", ' + this.appservice.tmp + ', ' + this.appservice.selectedLoc.location_id + ', "' + this.user.login + '", "", "", "' + date.getTime() + '", "")')
			.then((result_insert) => {
				this.assetsNo = "";
				this.assetsNoTxt = ast.ast_no;
				this.assetsNmTxt = ast.ast_nm_zh_tw + "" + ast.ast_nm_en;
				this.oldAssetsNoTxt = ast.ast_no_bk;
				// count again todo, checked
				this.tabObj.todo = this.tabObj.todo - 1;
				this.tabObj.checked = this.tabObj.checked + 1;
			}).catch((error) => {
				this.alertError('Insert into inv_checked fail: ' + JSON.stringify(error));
			});
	}
	updateInv_checked(id) {
		let date = new Date();
		PCCMP.database.executeSql('update inv_checked set checked_date = "' + date.getTime() + '" where id = ' + id)
			.then((result_insert) => {
				this.assetsNo = "";
			}).catch((error) => {
				this.alertError('update inv_checked fail: ' + JSON.stringify(error));
			});
	}
	confirmYesExtras() {
		let date = new Date();
		/**
		 * check extras existed
		 */
		PCCMP.database.executeSql('select *,count(*) num from inv_checked c, inv_location l, inv_sheets s where s.plan_id = l.plan_id and c.location_id = l.location_id and s.plan_id = ' + this.appservice.tmp + ' and l.location_id = ' + this.appservice.selectedLoc.location_id + ' and UPPER(c.ast_no) = UPPER("' + this.assetsNo + '")')
			.then(res => {
				if (res.rows[0].num > 0) {
					this.updateInv_checked(res.rows[0].id);
					this.assetsNoTxt = this.assetsNo;
					this.assetsNmTxt = "";
					this.oldAssetsNoTxt = "";
				} else {
					/**
					 * insert extras value
					 */
					PCCMP.database.executeSql('insert into inv_checked(id, ast_global_id, ast_no, plan_id, location_id, inv_checker, memo, idle_mk, checked_date, attr_update_date) values(NULL, "", UPPER("' + this.assetsNo + '"), ' + this.appservice.tmp + ', ' + this.appservice.selectedLoc.location_id + ', "' + this.user.login + '", "", "", "' + date.getTime() + '", "" )')
						.then((results) => {
							this.assetsNoTxt = this.assetsNo;
							this.assetsNo = "";
							// count again extras
							this.tabObj.extras = this.tabObj.extras + 1;
						}).catch((error) => {
							this.alertError('Insert into inv_checked fail: ' + JSON.stringify(error));
						});
				}
			})
			.catch((error) => {
				this.alertError('inventory not exist: ' + JSON.stringify(error));
				return;
			});


	}
	confirmNoExtras() {
		this.showPopup("System Information", "Wrong location!", false, "", "", "");
	}
	handleChooseComp(e) {
		PCCMP.database.executeSql('select *,count(*) count_ast from inv_checked c where c.plan_id = ' + this.appservice.tmp + ' and c.location_id = ' + this.appservice.selectedLoc.location_id + ' and c.ast_global_id = "' + e.ast_global_id + '"')
			.then((result_count) => {
				// Check assets insert only 1
				if (result_count.rows[0].count_ast == 0) {
					// call function to insert into inv_checked
					this.insertInv_checked(e);
				} else {
					// // call function to insert into inv_checked : post: checked_date
					this.updateInv_checked(e.id);
					this.assetsNoTxt = e.ast_no;
					this.assetsNmTxt = e.ast_nm_zh_tw + "" + e.ast_nm_en;
					this.oldAssetsNoTxt = e.ast_no_bk;

				}
			}).catch((error) => {
				this.alertError('test inv_checked insert or not - company name case: ' + JSON.stringify(error));
			});
	}
}