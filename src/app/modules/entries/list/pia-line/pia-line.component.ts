import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Attachment } from 'src/app/models/attachment.model';
import { Pia } from 'src/app/models/pia.model';
import { LanguagesService } from 'src/app/services/languages.service';
import { ModalsService } from 'src/app/services/modals.service';
import { PiaService } from 'src/app/services/pia.service';

import * as FileSaver from 'file-saver';
declare const require: any;

@Component({
  selector: 'app-pia-line',
  templateUrl: './pia-line.component.html',
  styleUrls: ['./pia-line.component.scss']
})
export class PiaLineComponent implements OnInit {
  @Input() pia: any;
  @Output() piaEvent = new EventEmitter<Pia>();
  attachments: any;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    public piaService: PiaService,
    private modalsService: ModalsService,
    private translateService: TranslateService,
    public languagesService: LanguagesService
  ) {}

  ngOnInit(): void {
    const attachmentModel = new Attachment();
    this.attachments = [];
    attachmentModel.pia_id = this.pia.id;
    attachmentModel.findAll().then((entries: any) => {
      entries.forEach(element => {
        if (element['file'] && element['file'].length) {
          this.attachments.push(element);
        }
      });
    });
  }

  /**
   * Generate a ZIP with the attachments and the .json
   */
  async generateZip(): Promise<void> {
    setTimeout(() => {
      const JSZip = require('jszip');
      const zip = new JSZip();
      /* Attachments */
      this.addAttachmentsToZip(zip).then((zip2: any) => {
        /* JSON */
        this.piaService.export(this.pia.id).then((data: any) => {
          zip2.file('pia.json', data, { binary: true });
          /* Save as .zip */
          zip2.generateAsync({ type: 'blob' }).then(blobContent => {
            FileSaver.saveAs(blobContent, 'pia-' + this.pia.name + '.zip');
          });
        });
      });
    }, 500);
  }

  /**
   * Add all active attachments (not the removed ones) to the zip after converting them as blob files
   * @param zip zip
   */
  async addAttachmentsToZip(zip): Promise<void> {
    return new Promise(async (resolve, reject) => {
      this.attachments.forEach(attachment => {
        const byteCharacters1 = atob((attachment.file as any).split(',')[1]);
        const folderName = this.translateService.instant(
          'summary.attachments'
        );
        zip.file(folderName + '/' + attachment.name, byteCharacters1, {
          binary: true
        });
      });
      resolve(zip);
    });
  }

  /**
   * Focus out field and update PIA.
   * @param attribute - Attribute of the PIA.
   * @param event - Any Event.
   */
  onFocusOut(attribute: string, event: any): void {
    const text = event.target.innerText;
    this.pia[attribute] = text;
    this.pia.update();
    this.piaEvent.emit(this.pia);
  }

  /**
   * Archive a PIA with a given id
   * @param id - The PIA id
   */
  archivePia(id: string): void {
    localStorage.setItem('pia-to-archive-id', id);
    this.modalsService.openModal('modal-archive-pia');
  }
}
