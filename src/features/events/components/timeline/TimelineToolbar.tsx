import { Maximize2, Search, Calendar } from "lucide-react";
import { Button } from "../../../../components/shared/UIComponents";

export function TimelineToolbar() {
    return (
        <div className="flex justify-end items-center mb-3 gap-2 opacity-50 pointer-events-none" title="Coming soon">
            {/* Placeholder for future toolbar actions */}
            <div className="flex bg-white rounded-md border border-gray-200 p-0.5 shadow-sm">
                <button className="px-3 py-1 text-xs font-medium bg-gray-100 rounded text-gray-700">Auto</button>
                <button className="px-3 py-1 text-xs font-medium text-gray-500 hover:text-gray-700">Days</button>
                <button className="px-3 py-1 text-xs font-medium text-gray-500 hover:text-gray-700">Weeks</button>
            </div>
            <Button variant="outline" size="sm" icon={<Maximize2 size={14} />} className="!px-2 border-gray-200">
                <span className="sr-only">Fit to Screen</span>
            </Button>
        </div>
    );
}
