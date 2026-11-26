# Local notes engine

The tutor has an initial offline extractive baseline, `cognify-local-extractive-v1`.
When the built-in curriculum provider is selected or remote providers fail, it
returns relevant indexed passages and their actual citations. It does not train a
model, paraphrase, reason, or verify that the passages answer the question.
If retrieval is below the configured threshold, it asks for better notes instead
of inventing an answer. Other workflows still use the bundled curriculum templates.

Next steps: build a consented, representative evaluation set of questions and
source passages; measure retrieval and answer quality; establish user isolation;
then evaluate a locally hosted open-weight model against this baseline before
considering fine-tuning. Training from scratch requires a dataset, hardware,
training infrastructure, and evaluation that are not included here.
