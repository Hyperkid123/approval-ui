import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useHistory } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Modal, Button, Text, TextContent, TextVariants, Spinner, Title } from '@patternfly/react-core';
import { useIntl } from 'react-intl';
import { ExclamationTriangleIcon } from '@patternfly/react-icons';
import { removeWorkflow, removeWorkflows, fetchWorkflow } from '../../redux/actions/workflow-actions';
import useQuery from '../../utilities/use-query';
import routes from '../../constants/routes';
import useWorkflow from '../../utilities/use-workflows';
import { FormItemLoader } from '../../presentational-components/shared/loader-placeholders';
import worfklowMessages from '../../messages/workflows.messages';
import commonMessages from '../../messages/common.message';
import isEmpty from 'lodash/isEmpty';
import { APP_DISPLAY_NAME } from '../../utilities/constants';

const RemoveWorkflowModal = ({
  ids = [],
  fetchData,
  setSelectedWorkflows
}) => {
  const dispatch = useDispatch();
  const [ fetchedWorkflow, setFetchedWorkflow ] = useState();
  const [ submitting, setSubmitting ] = useState(false);
  const { push } = useHistory();
  const [{ workflow: workflowId }] = useQuery([ 'workflow' ]);

  const finalId = workflowId || ids.length === 1 && ids[0];

  const intl = useIntl();
  const workflow = useWorkflow(finalId);

  useEffect(() => {
    if (finalId && !workflow) {
      dispatch(fetchWorkflow(finalId))
      .then(({ value }) => setFetchedWorkflow(value))
      .catch(() => push(routes.workflows.index));
    }
  }, []);

  if (!finalId && ids.length === 0) {
    return null;
  }

  const removeWf = () =>(finalId ? dispatch(removeWorkflow(finalId, intl)) : dispatch(removeWorkflows(ids, intl)))
  .catch(() => setSubmitting(false))
  .then(() => push(routes.workflows.index))
  .then(() => setSelectedWorkflows([]))
  .then(() => fetchData());

  const onCancel = () => push(routes.workflows.index);

  const onSubmit = () => {
    setSubmitting(true);
    return removeWf();
  };

  const dependenciesMessage = () => {
    const wf = workflow || fetchedWorkflow;
    if (!wf || isEmpty(wf) ||
        !wf.metadata || !wf.metadata.object_dependencies
        || isEmpty(wf.metadata.object_dependencies))
    {return [];}

    return Object.keys(wf.metadata.object_dependencies)
    .reduce((acc, item) => [ ...acc, `${APP_DISPLAY_NAME[item] || item}` ], []);
  };

  return (
    <Modal
      isOpen
      variant="small"
      aria-label={
        intl.formatMessage(worfklowMessages.removeProcessAriaLabel, { count: finalId ? 1 : ids.length })
      }
      header={
        <Title size="2xl" headingLevel="h1">
          <ExclamationTriangleIcon size="sm" fill="#f0ab00" className="pf-u-mr-sm" />
          { intl.formatMessage(worfklowMessages.removeProcessTitle, { count: finalId ? 1 : ids.length }) }
        </Title>
      }
      onClose={ onCancel }
      actions={ [
        <Button id="submit-remove-workflow" key="submit" variant="danger" type="button" isDisabled={ submitting } onClick={ onSubmit }>
          { submitting
            ? <React.Fragment><Spinner size="sm" className="pf-u-mr-md"/>{ intl.formatMessage(commonMessages.deleting) }</React.Fragment>
            : intl.formatMessage(commonMessages.delete)
          }
        </Button>,
        <Button id="cancel-remove-workflow" key="cancel" variant="link" type="button" isDisabled={ submitting } onClick={ onCancel }>
          { intl.formatMessage(commonMessages.cancel) }
        </Button>
      ] }
    >
      <TextContent>
        <Text component={ TextVariants.p }>
          {
            (finalId && !workflow && !fetchedWorkflow)
              ? <FormItemLoader/>
              : intl.formatMessage(worfklowMessages.removeProcessDescription, {
                name: <b key="remove-key">{
                  finalId
                    ? fetchedWorkflow && fetchedWorkflow.name || workflow && workflow.name
                    : (<React.Fragment>
                      { ids.length } { intl.formatMessage(worfklowMessages.approvalProcesses) }
                    </React.Fragment>)
                }</b>,
                dependenciesMessageValue:
                      isEmpty(dependenciesMessage()) ? '.' : intl.formatMessage(worfklowMessages.fromProcessDependencies, {
                        space: <React.Fragment>&nbsp;</React.Fragment>,
                        newline: <React.Fragment><br/><br/></React.Fragment>,
                        dependenciesList: <React.Fragment>{ dependenciesMessage().map(item => <React.Fragment key={ item }>
                          <li>{ item }</li>
                        </React.Fragment>) }</React.Fragment>
                      })
              }
              )
          }
        </Text>
      </TextContent>
    </Modal>
  );
};

RemoveWorkflowModal.propTypes = {
  fetchData: PropTypes.func.isRequired,
  setSelectedWorkflows: PropTypes.func.isRequired,
  ids: PropTypes.array
};

export default RemoveWorkflowModal;
