import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SYMBOLOGY_ICONS } from '../symbology-icons';

@Component({
    selector: 'app-icon-board',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './icon-board.component.html',
    styleUrls: ['./icon-board.component.scss']
})
export class IconBoardComponent {
    @Input() isInteractive: boolean = false;
    @Input() markers: any[] = []; // Type should be SymbologyMarker[]

    @Output() markerPlaced = new EventEmitter<{ icon: string, type: string, color: string }>();
    @Output() markerRemoved = new EventEmitter<string>();

    icons = SYMBOLOGY_ICONS;

    // Selected tool state
    selectedTool: 'Main' | 'Sub' | 'Delete' = 'Main';

    // Tools configuration
    tools: { id: 'Main' | 'Sub' | 'Delete', label: string, icon: string, color: string, class: string }[] = [
        { id: 'Main', label: 'Main Concept', icon: '?', color: 'green-500', class: 'text-green-500' },
        { id: 'Sub', label: 'Sub Concept', icon: '!', color: 'red-500', class: 'text-red-500' },
        { id: 'Delete', label: 'Remove', icon: 'delete', color: 'gray-400', class: 'text-gray-400' }
    ];

    getMarkersForIcon(iconChar: string) {
        return (this.markers || []).filter(m => m.icon === iconChar);
    }

    onIconClick(icon: any) {
        if (!this.isInteractive) return;

        if (this.selectedTool === 'Delete') {
            // If clicking icon, maybe remove ALL markers on it? 
            // Or show a mini-menu if multiple?
            // Simple UX: If tool is Delete, remove the last marker added to this icon?
            // Or requiring clicking the marker itself?
            // Let's support clicking the specific marker bubbling, but if clicking the cell, do nothing for delete?
            // Actually, deleting usually involves clicking the marker.
            return;
        }

        // Place marker
        // Determine color based on tool?
        // Main = Green, Sub = Red/Pink?
        const color = this.selectedTool === 'Main' ? 'green' : 'red';
        this.markerPlaced.emit({
            icon: icon.icon,
            type: this.selectedTool,
            color: color
        });
    }

    onMarkerClick(event: MouseEvent, marker: any) {
        event.stopPropagation(); // Don't trigger cell click
        if (!this.isInteractive) return;

        if (this.selectedTool === 'Delete') {
            this.markerRemoved.emit(marker.id);
        }
    }

    selectTool(toolId: 'Main' | 'Sub' | 'Delete') {
        this.selectedTool = toolId;
    }
}
