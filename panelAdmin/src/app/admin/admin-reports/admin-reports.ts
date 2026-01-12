import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import jsPDF from 'jspdf';

@Component({
  selector: 'admin-reports',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-reports.html',
  styleUrls: ['./admin-reports.css']
})
export class AdminReports {
  isLoading = false;
  private readonly API_BASE = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  generateReport(type: 'pdf' | 'csv') {
    this.isLoading = true;

    forkJoin({
      stats: this.http.get<any>(`${this.API_BASE}/admin/stats`),
      users: this.http.get<any[]>(`${this.API_BASE}/admin/reports/top-users`),
      vehicles: this.http.get<any[]>(`${this.API_BASE}/admin/reports/top-vehicles`)
    }).subscribe({
      next: ({ stats, users, vehicles }) => {
        if (type === 'csv') {
          this.downloadCSV(stats, users, vehicles);
        } else {
          this.downloadPDF(stats, users, vehicles);
        }
      },
      error: (err) => {
        console.error('Blad pobierania raportu:', err);
        alert('Nie udalo sie pobrac danych raportu.');
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  private downloadCSV(stats: any, users: any[], vehicles: any[]) {
    const rows: string[] = [];
    const SEP = ';';

    rows.push('STATYSTYKI SYSTEMU');
    rows.push(`Kategoria${SEP}Wartosc`);
    rows.push(`Pojazdy${SEP}${stats.vehicles}`);
    rows.push(`Uzytkownicy${SEP}${stats.users}`);
    rows.push(`Rezerwacje${SEP}${stats.reservations}`);
    rows.push('');

    rows.push('NAJAKTYWNIEJSI UZYTKOWNICY');
    rows.push(`LP${SEP}Nazwa uzytkownika${SEP}Email${SEP}Liczba aktywnosci`);
    users.forEach((u, i) => {
      rows.push(`${i + 1}${SEP}${u.username}${SEP}${u.email}${SEP}${u.totalActivity}`);
    });
    rows.push('');

    rows.push('NAJPOPULARNIEJSZE POJAZDY');
    rows.push(`LP${SEP}Marka${SEP}Model${SEP}Liczba wyswietlen`);
    vehicles.forEach((v, i) => {
      rows.push(`${i + 1}${SEP}${v.make}${SEP}${v.model}${SEP}${v.activityCount}`);
    });

    const csvContent = rows.join('\n');
    const BOM = '\uFEFF';

    this.saveFile(
      new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' }),
      'Raport_Systemu.csv'
    );
  }

  private appendCsvSection(rows: string[], data: any[]) {
    if (!data.length) {
      rows.push('Brak danych');
      return;
    }
    const keys = Object.keys(data[0]);
    rows.push(keys.join(','));
    data.forEach(item => {
      rows.push(keys.map(k => item[k]).join(','));
    });
  }

  private downloadPDF(stats: any, users: any[], vehicles: any[]) {
    const doc = new jsPDF();
    let y = 10;

    doc.setFontSize(14);
    doc.text('Raport Systemu Wynajmu Pojazdow', 10, y);
    y += 10;

    doc.setFontSize(12);
    doc.text('Statystyki systemu', 10, y);
    y += 8;
    doc.text(`Pojazdy: ${stats.vehicles}`, 10, y);
    y += 6;
    doc.text(`Uzytkownicy: ${stats.users}`, 10, y);
    y += 6;
    doc.text(`Rezerwacje: ${stats.reservations}`, 10, y);
    y += 10;

    y = this.renderUsers(doc, users, y);
    y += 6;
    this.renderVehicles(doc, vehicles, y);

    doc.save('Report.pdf');
  }

  private renderUsers(doc: jsPDF, users: any[], y: number): number {
    doc.text('Najaktywniejsi Uzytkownicy', 10, y);
    y += 8;

    if (!users.length) {
      doc.text('Brak danych', 10, y);
      return y + 8;
    }

    users.forEach((u, i) => {
      doc.text(
        `${i + 1}. ${u.username} (${u.email}) - ${u.totalActivity} aktywnosci`,
        10,
        y
      );
      y += 8;
      if (y > 280) {
        doc.addPage();
        y = 10;
      }
    });

    return y;
  }

  private renderVehicles(doc: jsPDF, vehicles: any[], y: number): number {
    doc.text('Najpopularniejsze Pojazdy', 10, y);
    y += 8;

    if (!vehicles.length) {
      doc.text('Brak danych', 10, y);
      return y + 8;
    }

    vehicles.forEach((v, i) => {
      doc.text(
        `${i + 1}. ${v.make} ${v.model} - ${v.activityCount} wyswietlen`,
        10,
        y
      );
      y += 8;
      if (y > 280) {
        doc.addPage();
        y = 10;
      }
    });

    return y;
  }

  private saveFile(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}