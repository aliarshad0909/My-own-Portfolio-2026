import { WorkflowCanvas } from "@/components/WorkflowCanvas";

export default function EditorPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#141024]">
          Visual Workflow Editor
        </h1>
        <p className="text-sm text-[#5b5575]">
          Drag, connect, configure, and test-run deterministic AI workflows with mandatory
          human-in-the-loop safety gates.
        </p>
      </div>
      <WorkflowCanvas />
    </div>
  );
}
