import { Component, OnInit, ElementRef, NgZone, ViewChild, AfterViewInit, AfterContentInit, AfterViewChecked, OnDestroy } from '@angular/core';
import { Routes, Router } from '@angular/router';
import { AppService } from '../app.services';
import { Subscription } from 'rxjs/Subscription';
import '../../assets/js/sdk.js';

declare var PCCMP: any;
@Component({
	selector: 'app-root',
	templateUrl: './fai-4.component.html'
})
export class fai4Component implements AfterViewInit {
	errorMessage: any;
	todoTab: any[];
	checked: any[];
	extras: any[];
	extrasModal: any;
	tmp:any;
	subs:Subscription;
	// the method ngOnInit will run some functions when loading page firstly
	ngOnInit(): void {
		this.extrasModal = this.elRef.nativeElement.querySelector('#btnCtrlModal');
		// when window appear scroll bar, it will run ngAfterViewInit method
		window.onresize = () => {
			this.ngAfterViewInit();
		};
		this.onSelect();
	}
	constructor(
		private elRef: ElementRef,
		private router: Router,
		private appservice: AppService
	) {
		window.onerror = function (message) { alert(message); return true; };
		this.subs = appservice.dialogSaid$.subscribe(mess => {
			if(mess.choose === "yes"){
				this.confirmDeleteExtras();
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
	ngOnDestroy(){
		this.subs.unsubscribe();
	}
	ngAfterViewInit() {
		//set height for div has id = FAI4home to show scroll bar when overload height
		let div: any = document.getElementsByClassName("fai4-tab");
		div[0].style.height = window.innerHeight - 130 + "px";
		div[1].style.height = window.innerHeight - 130 + "px";
		div[2].style.height = window.innerHeight - 130 + "px";
	}
	/**
	 * todo = ast - checked
	 */
	onSelect(): void {
		PCCMP.database
			.executeSql('select * from inv_ast where location_id=' + this.appservice.selectedLoc.location_id + ' and id NOT IN (select c.id from inv_checked c, inv_ast a where c.id = a.id and c.location_id =' + this.appservice.selectedLoc.location_id + ')')
			.then((res) => {
				this.todoTab = res.rows;
			})
			.then(() => {
				PCCMP.database
					.executeSql('select a.* from inv_checked c, inv_ast a where c.id = a.id and c.location_id =' + this.appservice.selectedLoc.location_id)
					.then((res2) => {
						this.checked = res2.rows;
					})
					.then(() => {
						PCCMP.database
							.executeSql('select * from inv_checked c where (c.id = "" or c.id is NULL) and c.location_id = ' + this.appservice.selectedLoc.location_id)
							.then((res3) => {
								this.extras = res3.rows;
							}).catch((error) => {
								alert('error : ' + JSON.stringify(error));
							});
					})
					.catch((error) => {
						alert('error : ' + JSON.stringify(error));
					});
			})
			.catch((error) => {
				alert('error : ' + JSON.stringify(error));
			});
	}
	handleBack(){
		this.router.navigate(['/fai2']);
	}
	handleTodo(ast) {
		this.appservice.selectedAst = ast.id;
		this.appservice.typeAstTable = 'inv_ast';
		this.router.navigate(['/fai5']);
	}
	handleChecked(ast) {
		this.appservice.selectedAst = ast.id;
		this.appservice.typeAstTable = 'inv_checked';
		this.router.navigate(['/fai5']);
	}
	deleteExtras(e) {
		this.showPopup("System Information", "Delete this extras data ?", true, "", "", "");
		this.tmp = e;
	}
	confirmDeleteExtras() {
		PCCMP.database.executeSql('delete from inv_checked where ast_no = "' + this.tmp.ast_no + '"')
			.then((res2) => {
				let index: number = this.extras.indexOf(this.tmp);
				if (index !== -1) {
					this.extras.splice(index, 1);
				}
			})
			.catch((error) => {
				alert('error when delete extras: ' + JSON.stringify(error));
			});
	}
	handleExtras(){
		this.showPopup("System Information", "No this fixed-assets data", false, "", "", "");
	}
}