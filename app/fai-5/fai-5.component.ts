import { Component, ElementRef, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AppService } from '../app.services';
import { Subscription } from 'rxjs/Subscription';
import '../../assets/js/sdk.js';

declare var PCCMP: any;
@Component({
	selector: 'app-root',
	templateUrl: './fai-5.component.html'
})
export class fai5Component implements OnInit {
	listView: any;
	stateList: any;
	idleMkValue: any;
	subs: Subscription;
	// the method ngOnInit will run some functions when loading page firstly
	ngOnInit(): void {
		// when window appear scroll bar, it will run ngAfterViewInit method
		window.onresize = () => {
			this.ngAfterViewInit();
		};
		this.onSelect();
	}
	constructor(
		private elRef: ElementRef,
		private appservice: AppService,
		private router: Router
	) {
		this.subs = appservice.dialogSaid$.subscribe(mess => mess);
	}
	alertError(mess: string) {
		var dialog = {
			title: "Error",
			content: mess,
			btnYN: false,
			access: { yes: "none", no: "none", choose: "none" }
		};
		this.appservice.faiSay(dialog);
	}
	ngOnDestroy() {
		this.subs.unsubscribe();
	}
	ngAfterViewInit() {
		//set height for div has id = FAI4home to show scroll bar when overload height
		let div: any = this.elRef.nativeElement.querySelector('#FAI-5 .upage-outer .upage-content');
		div.style.height = window.innerHeight - 48 + "px";
	}
	onSelect(): void {
		if (this.appservice.typeAstTable === 'inv_ast'){
			PCCMP.database
			.executeSql('select * from inv_ast where id=' + this.appservice.selectedAst)
			.then((res) => {
				this.listView = res.rows[0];
			})
			.then(() => {
				PCCMP.database.executeSql('select * from inv_parameter')
					.then((res_ast) => {
						this.stateList = res_ast.rows;
						for (let i in this.stateList) {
							if (this.stateList[i].no === this.listView.idle_mk) {
								this.idleMkValue = this.stateList[i];
							}
						}
					}).catch((error) => {
						alert('get data inv_parameter fail: ' + JSON.stringify(error));
					});
			})
			.catch((error) => {
				alert('get data inv_ast fail: ' + JSON.stringify(error));
			});
		}else{
			PCCMP.database
			.executeSql('select c.idle_mk, c.memo, a.ast_global_id, a.id, a.location_id, a.ast_no, a.comp_nm, a.ast_nm_zh_tw, a.ast_nm_en, a.style_no, a.brand_nm, a.pur_date_fact, a.keeper_nm from inv_checked c,inv_ast a where a.id=c.id and a.id=' + this.appservice.selectedAst)
			.then((res) => {
				this.listView = res.rows[0];
			})
			.then(() => {
				PCCMP.database.executeSql('select * from inv_parameter')
					.then((res_ast) => {
						this.stateList = res_ast.rows;
						for (let i in this.stateList) {
							if (this.stateList[i].no === this.listView.idle_mk) {
								this.idleMkValue = this.stateList[i];
							}
						}
					}).catch((error) => {
						alert('get data inv_parameter fail: ' + JSON.stringify(error));
					});
			})
			.catch((error) => {
				alert('get data inv_ast fail: ' + JSON.stringify(error));
			});
		}
	}
	handleBack() {
		if (this.appservice.typeAstTable === "inv_checked") {
			PCCMP.database
				.executeSql('update inv_checked set idle_mk="' + this.idleMkValue.no + '",memo="' + this.listView.memo + '" where id=' + this.listView.id)
				.then(() => {
					this.router.navigate(['/fai4']);
				}).catch((error) => {
					alert(JSON.stringify(error));
				});
		} else {
			this.router.navigate(['/fai4']);
		}

	}
	handleSelectState(event: string): void {
		this.idleMkValue = JSON.parse(event);
		//alert(JSON.stringify(loc));
	}
}