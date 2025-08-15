/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import * as React from "react";
import { Form, Row, Col } from "react-bootstrap";

interface LOVFormProps {
  onCancel: () => void;
  SpfxContext: any;
}

const LOVForm: React.FC<LOVFormProps> = ({ onCancel, SpfxContext }) => {
  return (
    <Form className="p-3">
      <Row>
        <Col md={3}>
          <Form.Group>
            <Form.Label>LOV Type *</Form.Label>
            <Form.Select>
              <option>Select</option>
            </Form.Select>
          </Form.Group>
        </Col>

        <Col md={3}>
          <Form.Group>
            <Form.Label>ID *</Form.Label>
            <Form.Control type="text" placeholder="Enter value" />
          </Form.Group>
        </Col>

        <Col md={3}>
          <Form.Group>
            <Form.Label>Display Text *</Form.Label>
            <Form.Control type="text" placeholder="Enter value" />
          </Form.Group>
        </Col>

        <Col md={3}>
          <Form.Group>
            <Form.Label>Code *</Form.Label>
            <Form.Control type="text" placeholder="Enter value" />
          </Form.Group>
        </Col>
      </Row>

      <Row className="mt-3">
        <Col md={3}>
          <Form.Group>
            <Form.Label>Status *</Form.Label>
            <Form.Select>
              <option>Select</option>
            </Form.Select>
          </Form.Group>
        </Col>

        <Col md={3}>
          <Form.Group>
            <Form.Label>Attribute1 *</Form.Label>
            <Form.Control type="text" placeholder="Enter value" />
          </Form.Group>
        </Col>

        <Col md={3}>
          <Form.Group>
            <Form.Label>Attribute2 *</Form.Label>
            <Form.Control type="text" placeholder="Enter value" />
          </Form.Group>
        </Col>

        <Col md={3}>
          <Form.Group>
            <Form.Label>Attribute3 *</Form.Label>
            <Form.Control type="text" placeholder="Enter value" />
          </Form.Group>
        </Col>
      </Row>

      <Row className="mt-3">
        <Col md={3}>
          <Form.Group>
            <Form.Label>Attribute4 *</Form.Label>
            <Form.Control type="text" placeholder="Enter value" />
          </Form.Group>
        </Col>

        <Col md={3}>
          <Form.Group>
            <Form.Label>Attribute5 *</Form.Label>
            <Form.Control type="text" placeholder="Enter value" />
          </Form.Group>
        </Col>

        <Col md={3}>
          <Form.Group>
            <Form.Label>Parent *</Form.Label>
            <Form.Select>
              <option>Select</option>
            </Form.Select>
          </Form.Group>
        </Col>
      </Row>

      <Row className="mt-3">
        <Col md={12}>
          <Form.Group>
            <Form.Label> Description *</Form.Label>
            <Form.Control
              as="textarea"
              placeholder="Allowed 1000 characters only"
              rows={3}
            />
          </Form.Group>
        </Col>
      </Row>
    </Form>
  );
};

export default LOVForm;
