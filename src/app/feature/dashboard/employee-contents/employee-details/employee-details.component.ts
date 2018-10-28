import { debounceTime, distinctUntilChanged, tap, switchMap, catchError } from 'rxjs/operators';
import { Observable, concat, of, Subject } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { EmployeeService } from './../../services/employee.service';
import { FormGroup, FormControl, Validators, FormBuilder } from '@angular/forms';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-employee-details',
  templateUrl: './employee-details.component.html',
  styleUrls: ['./employee-details.component.css']
})
export class EmployeeDetailsComponent implements OnInit {

  private id: number;
  private sub: any;
  private isEdit: boolean = false;
  employeeEditForm: FormGroup;
  supervisorEmployees: Observable<any>;
  employeeinput$ = new Subject<string>();
  isSelectLoading: boolean = false;

  private isEmployeeSelected: boolean = false;
  private selectedEmployee;
  errorMsg;

  update_employee_msg;
  has_error: boolean = false;
  submitted: boolean = false;

  constructor(private route: ActivatedRoute, private formBuilder: FormBuilder, private _employeeService: EmployeeService) { }

  ngOnInit() {
    this.routeId();
  }

  routeId() {
    this.sub = this.route.params.subscribe(params => {
      this.id = +params['id']; // (+) converts string 'id' to a number
      this.getEmployeeById(this.id);
    });
  }

  initEditForm() {
    this.employeeEditForm = this.formBuilder.group({
      employeeId: [this.selectedEmployee.employeeId],
      firstName: [this.selectedEmployee.firstName, [Validators.required, Validators.minLength(2)]],
      middleName: [this.selectedEmployee.middleName],
      lastName: [this.selectedEmployee.lastName, [Validators.required, Validators.minLength(2)]],
      username: [this.selectedEmployee.username, [Validators.required, Validators.minLength(2)]],
      phoneNumber: [this.selectedEmployee.phoneNumber, [Validators.required, Validators.min(1000000000), Validators.max(9999999999)]],
      email: [this.selectedEmployee.email],
      supervisor: [this.selectedEmployee.supervisor],
      status: [this.selectedEmployee.status, Validators.required]
    });
    this.loadEmployee();
  }

  private loadEmployee() {
    this.supervisorEmployees = concat(
      of([]), // default items
      this.employeeinput$.pipe(
        debounceTime(200),
        distinctUntilChanged(),
        tap(() => this.isSelectLoading = true),
        switchMap(term => this._employeeService.getEmployeeByFullName(term).pipe(
          catchError(() => of([])), // empty list on error
          tap(() => this.isSelectLoading = false)
        ))
      )
    );
  }

  getEmployeeById(id: number) {
    if (id > 0) {
      this._employeeService.getEmployeeById(id)
        .subscribe(
          data => {
            this.selectedEmployee = data;
            this.isEmployeeSelected = true;
            console.log("selectedEmployee data: ", data);
            this.initEditForm();
          },
          error => this.errorMsg = error);
    } else {
      this.isEmployeeSelected = false;
    }
  }

  toggleEdit() {
    this.isEdit = !this.isEdit;
    this.update_employee_msg = "";
  }

  get f() { return this.employeeEditForm.controls; }

  onSubmit() {
    this.submitted = true;

    console.log(this.employeeEditForm.value);

    // stop here if form is invalid
    if (this.employeeEditForm.invalid) {
      return;
    }
    console.log("success ", this.employeeEditForm.value);
    this._employeeService.updateEmployee(this.employeeEditForm.value).subscribe(res => {
      this.has_error = false;
      this.update_employee_msg = "Update Successful";
    }, error => {
      console.log("ee ", error);
      this.has_error = true;
      this.update_employee_msg = error.error.message;;
    });

  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

}
