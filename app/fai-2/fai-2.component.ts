import { Component, OnInit, ElementRef, NgZone, ViewChild, AfterViewInit, AfterContentInit, AfterViewChecked } from '@angular/core';
import { Routes, Router } from '@angular/router';
import * as _ from "lodash";
import { AppService } from '../app.services';
import '../../assets/js/sdk.js';
import { Subscription } from 'rxjs/Subscription';

declare var PCCMP: any;

@Component({
	selector: 'app-root',
	templateUrl: './fai-2.component.html'
})
export class fai2Component implements OnInit {
	zone: NgZone;
	qrScanBox: string;
	locs: any;
	selectedLoc: any;
	dropdownListModel: any;
	subs = new Subscription;
	// the method ngOnInit will run some functions when loading page firstly
	ngOnInit(): void {
		this.onSelect();
	}
	ngOnDestroy(){
		this.subs.unsubscribe();
	}
	constructor(private elRef: ElementRef, private router: Router, zone: NgZone, private appservice: AppService) {
		this.zone = zone;
		this.subs = appservice.dialogSaid$.subscribe(mess => mess);
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
	barcodeScanHandler = (data: number): void => {
		console.log(new Date().toISOString());
		let isMatchLoc = false;
		this.zone.run(() => {
			for (let i = 0; i < this.locs.length; i++) {
				if (data == this.locs[i].location_id) {
					isMatchLoc = true;
					this.appservice.selectedLoc = this.locs[i];
					this.dropdownListModel = this.locs[i];
				}
			}
			if (!isMatchLoc) {
				this.appservice.selectedLoc = "";
				this.dropdownListModel = "";
				this.showPopup('System information','No this location !, QRCode does not match location after Scan',false,"","","");
			}
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
		let invTable = PCCMP.database.getTable('inv_location');
		invTable.get('plan_id = ' + this.appservice.tmp)
			.then((results) => {
				this.locs = results.rows;
				this.openBarcodeScanner();
				this.dropdownListModel = this.locs[1];
			})
			.then(() => {
				this.dropdownListModel = this.appservice.selectedLoc;
				//this.alertError(JSON.stringify(this.dropdownListModel));
			}).catch((error) => {
				this.alertError('get data inv_location fail :' + JSON.stringify(error));
			});
	}
	// handling when use click record button
	handleRecordBtn() {
		if (this.appservice.selectedLoc == "") {
			this.showPopup('System information','Need to select location first!',false,"","","");
		} else {
			this.closeBarcodeScanner();
			this.router.navigate(['/fai4']);
		}
	}
	// handling when use click record button
	handleInvCheckBtn() {
		if (this.appservice.selectedLoc == "") {
			this.showPopup('System information','Need to select location first!',false,"","","");
		} else {
			this.closeBarcodeScanner();
			this.router.navigate(['/fai3']);
		}
	}
	// handling select loccation
	handleSelectLoc(event:string): void{
		this.appservice.selectedLoc = JSON.parse(event);
		this.dropdownListModel = JSON.parse(event);
		//this.alertError(JSON.stringify(loc));
	}
	// handling back to fai1
	handleBacktoFai1() {
		this.closeBarcodeScanner();
		this.appservice.selectedLoc = "";
	}
}