/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @rushstack/no-new-null */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-floating-promises */
import * as React from "react";
import { useEffect, useState } from "react";
import {
  Form,
  Row,
  Col,
  Button,
  Card,
  Alert,
  Breadcrumb,
} from "react-bootstrap";
import { useForm, Controller } from "react-hook-form";
import { spfi, SPFx } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";

interface LOVFormProps {
  onCancel: () => void;
  onSaved?: () => void;
  SpfxContext: any;
  editItem?: any;
  mode: "add" | "edit";
}

interface LOVItem {
  Id: number;
  Title: string;
  Value: string;
  Status: string;
  ParentId: number | null;
  Parent?: LOVItem;
  Level?: number;
}

const LOVForm: React.FC<LOVFormProps> = ({
  onCancel,
  SpfxContext,
  editItem,
  mode,
  onSaved,
}) => {
  const { handleSubmit, control, reset, watch, setValue } = useForm();
  const sp = spfi().using(SPFx(SpfxContext));

  const [statusOptions] = useState(["Active", "Inactive"]);
  const [titleOptions, setTitleOptions] = useState<string[]>([]);
  const [allItems, setAllItems] = useState<LOVItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [saveMessage, setSaveMessage] = useState<{
    type: string;
    text: string;
  } | null>(null);

  // const selectedTitle = watch("Title");
  watch("Parent1");
  // const parent2 = watch("Parent2");
  // watch("Parent2");

  // Load data
  const loadData = async () => {
    try {
      setIsLoading(true);
      const items: LOVItem[] = await sp.web.lists
        .getByTitle("LOVData1")
        .items.select(
          "Id",
          "Title",
          "Value",
          "Status",
          "ParentId",
          "Parent/Id",
          "Parent/Title",
          "Parent/Value"
        )
        .expand("Parent")();

      const itemsWithLevels = items.map((item) => {
        let level = 0;
        let current = item;
        while (current.ParentId) {
          level++;
          const parent = items.find((i) => i.Id === current.ParentId);
          if (!parent) break;
          current = parent;
        }
        return { ...item, Level: level };
      });

      setAllItems(itemsWithLevels);

      const uniqueTitles = Array.from(
        new Set(items.map((i) => i.Title))
      ).sort();
      setTitleOptions(uniqueTitles);

      if (mode === "edit" && editItem) {
        const itemToEdit = itemsWithLevels.find(
          (item) => item.Id === editItem.Id
        );
        if (itemToEdit) {
          reset({
            Title: itemToEdit.Title,
            Value: itemToEdit.Value,
            Status: itemToEdit.Status,
          });

          // Set up parent hierarchy for editing
          if (itemToEdit.ParentId) {
            const parentItem = items.find((i) => i.Id === itemToEdit.ParentId);
            if (parentItem) {
              setValue("Parent1", parentItem.Id.toString());

              // --- Parent2 disabled ---
              // if (parentItem.ParentId) {
              //   const grandParent = items.find(
              //     (i) => i.Id === parentItem.ParentId
              //   );
              //   if (grandParent) {
              //     setValue("Parent2", grandParent.Id.toString());
              //   }
              // }
            }
          }
        }
      }
    } catch (err) {
      console.error("Error loading data:", err);
      setSaveMessage({ type: "danger", text: "Error loading data" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onSubmit = async (data: any) => {
    try {
      if (mode === "add") {
        // Add mode → only Parent1
        let parentId: number | null = null;
        if (data.Parent1) {
          parentId = parseInt(data.Parent1, 10);
        }

        await sp.web.lists.getByTitle("LOVData1").items.add({
          Title: data.Title,
          Value: data.Value,
          Status: data.Status,
          ParentId: parentId,
        });

        setSaveMessage({
          type: "success",
          text: "LOV item added successfully!",
        });
        reset();
      }

      if (mode === "edit" && editItem) {
        // Step 1: current item ParentId = Parent1
        const parent1Id = data.Parent1 ? parseInt(data.Parent1, 10) : null;
        await sp.web.lists
          .getByTitle("LOVData1")
          .items.getById(editItem.Id)
          .update({
            Title: data.Title,
            Value: data.Value,
            Status: data.Status,
            ParentId: parent1Id,
          });

        // --- Parent2 disabled ---
        // Step 2: update Parent1’s ParentId = Parent2 (if exists)
        // if (parent1Id && data.Parent2) {
        //   const parent2Id = parseInt(data.Parent2, 10);
        //   await sp.web.lists
        //     .getByTitle("LOVData1")
        //     .items.getById(parent1Id)
        //     .update({
        //       ParentId: parent2Id,
        //     });
        // }

        setSaveMessage({
          type: "success",
          text: "LOV item updated successfully!",
        });
      }

      setTimeout(() => loadData(), 1000);
      if (onSaved) onSaved();
    } catch (err) {
      console.error(err);
      setSaveMessage({ type: "danger", text: "Error while saving item" });
    }
  };

  const getParentOptions = (level: number) => {
    if (mode === "add") {
      if (level === 1) {
        return allItems; // all items as possible parents
      }
      return [];
    }

    if (mode === "edit") {
      if (level === 1) {
        return allItems.filter(
          (item) =>
            item.Id !== editItem?.Id && !isDescendant(item, editItem?.Id)
        );
      }

      // --- Parent2 disabled ---
      // if (level === 2 && parent1Id) {
      //   return allItems.filter(
      //     (item) =>
      //       item.Id !== parent1Id &&
      //       item.Id !== editItem?.Id &&
      //       !isDescendant(item, parent1Id)
      //   );
      // }
    }

    return [];
  };

  // Helper function to check if an item is a descendant of another item
  const isDescendant = (
    item: LOVItem,
    targetId: number | undefined
  ): boolean => {
    if (!targetId) return false;

    let current = item;
    while (current.ParentId) {
      if (current.ParentId === targetId) return true;
      // Find the parent item
      const parent = allItems.find((i) => i.Id === current.ParentId);
      if (!parent) break;
      current = parent;
    }
    return false;
  };

  const parent1Options = getParentOptions(1);
  // const parent2Options = getParentOptions(2);

  // --- Parent2 disabled ---
  // const parent1Id = parent1 ? parseInt(parent1, 10) : null;
  // const parent1Item = parent1Id
  //   ? allItems.find((i) => i.Id === parent1Id)
  //   : null;
  // const shouldShowParent2 = mode === "edit" && parent1Item?.ParentId;

  if (isLoading) {
    return <div className="p-3 text-center">Loading...</div>;
  }

  return (
    <div className="p-3">
      <Card>
        <Card.Header>
          <h5>{mode === "add" ? "Add New LOV Value" : "Edit LOV Value"}</h5>
          {mode === "edit" && editItem && (
            <Breadcrumb className="mt-2">
              <Breadcrumb.Item>Editing: {editItem.Title}</Breadcrumb.Item>
              <Breadcrumb.Item>{editItem.Value}</Breadcrumb.Item>
            </Breadcrumb>
          )}
        </Card.Header>
        <Card.Body>
          {saveMessage && (
            <Alert
              variant={saveMessage.type}
              onClose={() => setSaveMessage(null)}
              dismissible
            >
              {saveMessage.text}
            </Alert>
          )}

          <Form onSubmit={handleSubmit(onSubmit)}>
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Category *</Form.Label>
                  <Controller
                    name="Title"
                    control={control}
                    rules={{ required: "Category is required" }}
                    render={({ field, fieldState }) => (
                      <>
                        <Form.Select {...field} isInvalid={!!fieldState.error}>
                          <option value="">Select Category</option>
                          {titleOptions.map((title, i) => (
                            <option key={i} value={title}>
                              {title}
                            </option>
                          ))}
                        </Form.Select>
                        <Form.Control.Feedback type="invalid">
                          {fieldState.error?.message}
                        </Form.Control.Feedback>
                      </>
                    )}
                  />
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Value *</Form.Label>
                  <Controller
                    name="Value"
                    control={control}
                    rules={{ required: "Value is required" }}
                    render={({ field, fieldState }) => (
                      <>
                        <Form.Control
                          type="text"
                          placeholder="Enter value"
                          {...field}
                          isInvalid={!!fieldState.error}
                        />
                        <Form.Control.Feedback type="invalid">
                          {fieldState.error?.message}
                        </Form.Control.Feedback>
                      </>
                    )}
                  />
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Status *</Form.Label>
                  <Controller
                    name="Status"
                    control={control}
                    rules={{ required: "Status is required" }}
                    render={({ field, fieldState }) => (
                      <>
                        <Form.Select {...field} isInvalid={!!fieldState.error}>
                          <option value="">Select Status</option>
                          {statusOptions.map((status, i) => (
                            <option key={i} value={status}>
                              {status}
                            </option>
                          ))}
                        </Form.Select>
                        <Form.Control.Feedback type="invalid">
                          {fieldState.error?.message}
                        </Form.Control.Feedback>
                      </>
                    )}
                  />
                </Form.Group>
              </Col>
            </Row>

            {/* Parent selection for both add and edit modes */}
            <Row className="mt-3">
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    {mode === "add" ? "Optional Parent" : "Parent"}
                  </Form.Label>
                  <Controller
                    name="Parent1"
                    control={control}
                    render={({ field }) => (
                      <Form.Select {...field}>
                        <option value="">
                          {mode === "add"
                            ? "Select Parent (Optional)"
                            : "Select Parent"}
                        </option>
                        {parent1Options.map((item) => (
                          <option key={item.Id} value={item.Id}>
                            {item.Title} - {item.Value}
                            {item.ParentId
                              ? ` (Child of ${item.Parent?.Value})`
                              : ""}
                          </option>
                        ))}
                      </Form.Select>
                    )}
                  />
                  <Form.Text className="text-muted">
                    Select a parent for this item
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            {/* --- Parent2 field disabled ---
            {shouldShowParent2 && (
              <Row className="mt-3">
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Parent (Level 2)</Form.Label>
                    <Controller
                      name="Parent2"
                      control={control}
                      render={({ field }) => (
                        <Form.Select {...field}>
                          <option value="">Select Parent (Optional)</option>
                          {parent2Options.map((item) => (
                            <option key={item.Id} value={item.Id}>
                              {item.Title} - {item.Value}
                              {item.ParentId
                                ? ` (Child of ${item.Parent?.Value})`
                                : ""}
                            </option>
                          ))}
                        </Form.Select>
                      )}
                    />
                    <Form.Text className="text-muted">
                      Select a parent for the selected parent above
                    </Form.Text>
                  </Form.Group>
                </Col>
              </Row>
            )} */}

            <div className="mt-4 d-flex justify-content-end">
              <Button
                variant="outline-secondary"
                onClick={onCancel}
                className="me-2"
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                {mode === "add" ? "Add Value" : "Update Value"}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
};

export default LOVForm;
