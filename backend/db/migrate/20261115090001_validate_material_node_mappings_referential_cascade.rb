# frozen_string_literal: true

# Second step of the strong_migrations two-step dance (the
# plan_scoped_chat_threads precedent): validate the two cascading FKs the
# MaterialNodeMappingsReferentialCascade migration re-added as
# validate: false.
class ValidateMaterialNodeMappingsReferentialCascade < ActiveRecord::Migration[8.1]
  def change
    validate_foreign_key :material_node_mappings, :knowledge_nodes, column: :node_id
    validate_foreign_key :material_node_mappings, :materials
  end
end
