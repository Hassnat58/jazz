/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-floating-promises */
import * as React from "react";
import { useEffect, useState } from "react";
import { Form, Row, Col } from "react-bootstrap";
import { useForm, Controller } from "react-hook-form";
import { spfi, SPFx } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import styles from "./CaseForm.module.scss";

interface LOVFormProps {
  onCancel: () => void;
  SpfxContext: any;
}

const LOVForm: React.FC<LOVFormProps> = ({ onCancel, SpfxContext }) => {
  const { handleSubmit, control, reset } = useForm();
  const [lovTypes, setLovTypes] = useState<string[]>([]);
  const [statusOptions] = useState(["Active", "Inactive"]);
  const sp = spfi().using(SPFx(SpfxContext));

  // Load distinct LOV Types (Title column)
  useEffect(() => {
    sp.web.lists
      .getByTitle("LOV Data")
      .items.select("Title")()
      .then((res) => {
        const uniqueTypes = Array.from(new Set(res.map((i) => i.Title)));
        setLovTypes(uniqueTypes);
      });
  }, []);

  // Save data to SharePoint
  const onSubmit = async (data: any) => {
    try {
      await sp.web.lists.getByTitle("LOV Data").items.add({
        Title: data.LOVType, // LOV Type
        Description: data.Option, // Dropdown option text
        Status: data.Status, // Active/Inactive
      });
      alert("New option added successfully!");
      reset();
    } catch (err) {
      console.error(err);
      alert("Error while saving option");
    }
  };

  return (
    <Form className="p-3" onSubmit={handleSubmit(onSubmit)}>
      <div className={styles.topbuttongroup}>
        <button type="button" className={styles.cancelbtn} onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className={styles.savebtn}>
          Submit
        </button>
      </div>

      <Row>
        <Col md={4}>
          <Form.Group>
            <Form.Label>LOV Type *</Form.Label>
            <Controller
              name="LOVType"
              control={control}
              render={({ field }) => (
                <Form.Select {...field}>
                  <option value="">Select</option>
                  {lovTypes.map((t, i) => (
                    <option key={i} value={t}>
                      {t}
                    </option>
                  ))}
                </Form.Select>
              )}
            />
          </Form.Group>
        </Col>

        <Col md={4}>
          <Form.Group>
            <Form.Label>Option (Description) *</Form.Label>
            <Controller
              name="Option"
              control={control}
              render={({ field }) => (
                <Form.Control
                  type="text"
                  placeholder="Enter option text"
                  {...field}
                />
              )}
            />
          </Form.Group>
        </Col>

        <Col md={4}>
          <Form.Group>
            <Form.Label>Code</Form.Label>
            <Controller
              name="Code"
              control={control}
              render={({ field }) => (
                <Form.Control
                  type="text"
                  placeholder="Enter code (optional)"
                  {...field}
                />
              )}
            />
          </Form.Group>
        </Col>
      </Row>

      <Row className="mt-3">
        <Col md={4}>
          <Form.Group>
            <Form.Label>Status *</Form.Label>
            <Controller
              name="Status"
              control={control}
              render={({ field }) => (
                <Form.Select {...field}>
                  <option value="">Select</option>
                  {statusOptions.map((s, i) => (
                    <option key={i} value={s}>
                      {s}
                    </option>
                  ))}
                </Form.Select>
              )}
            />
          </Form.Group>
        </Col>
      </Row>
    </Form>
  );
};

export default LOVForm;
