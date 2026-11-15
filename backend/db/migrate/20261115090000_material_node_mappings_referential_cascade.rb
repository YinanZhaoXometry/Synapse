# frozen_string_literal: true

# The material_node_mappings child rows carried bare FKs on node_id
# (nullable — gap/orphan rows point at nothing) and material_id: any
# knowledge_nodes/materials delete outside the two delete commands' sweeps
# raised InvalidForeignKey mid-transaction (owner bug round 2026-11-15 —
# deleting a task or plan with mapped materials exploded). The command
# sweeps stay in place (the architecture's explicit deepest-first ordering);
# this migration makes the same contract a database floor, so no current or
# future path can violate it.
class MaterialNodeMappingsReferentialCascade < ActiveRecord::Migration[8.1]
  def change
    remove_foreign_key :material_node_mappings, :knowledge_nodes, column: :node_id
    add_foreign_key :material_node_mappings, :knowledge_nodes, column: :node_id, on_delete: :cascade
    remove_foreign_key :material_node_mappings, :materials
    add_foreign_key :material_node_mappings, :materials, on_delete: :cascade
  end
end
