# SA3 Concepts and Hyperparameters — authoring record

Confirmed plan and latest user steering: 50 fresh items; 20 single-answer MCQ, 10 true/false, 20 blanks; no multiple-answer items. The user subsequently requested conceptual identification, including splitting criteria: the blanks now comprise 12 hyperparameter identifiers and 8 conceptual identification items (two concepts per model). Hyperparameter blanks retain both description and snippet formats for every model. Difficulty: 25 easy, 20 medium, 5 hard. Untimed Prep, default 60-minute Exam, both shuffles enabled. The supplied confirmed plan supersedes repeat configuration confirmation.

PDF locators are physical pages counted from 1. Notebook cells count every Markdown and code cell from 1, not execution_count. Sources were read directly from the original PDFs with pypdf and original notebook JSON. Evidence snippets below were checked against those original page/cell texts with only whitespace normalization. Snippets in prompts are adapted by masking identifiers and reformatting; all numeric values are supplied, never memorization targets.

The original reviewer and all its existing companion files are preserved. This bank uses a distinct ID and content fingerprint. Hyperparameter blanks accept only the correct identifier (case and repeated whitespace ignored; punctuation and spelling significant). Conceptual blanks deliberately enumerate accepted names and abbreviations; no fuzzy matching. Gini index is accepted as a standard name for Gini impurity. Difficulty describes author-estimated reasoning demand, not measured exam difficulty.

## Coverage

| Topic | MCQ | TF | Blank | Easy | Medium | Hard |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Decision Trees | 5 | 3 | 5 | 7 | 5 | 1 |
| Random Forest | 5 | 2 | 5 | 6 | 5 | 1 |
| Gradient Boosting | 5 | 3 | 5 | 6 | 5 | 2 |
| SVM | 5 | 2 | 5 | 6 | 5 | 1 |

## Source boundaries and omissions

- Uses only sa3/docs and matching decision-tree, forest, boosting and SVM notebooks. No earlier unrelated units or linked video contents. The regression-tree weighted-MSE item belongs to decision-tree behavior. No model training or data-dependent accuracy claim is required.
- Omits historical library defaults, the ensemble PDF's mini_sample_leaf typo and unreliable definition, its n_jobs interpretation, the main slide's estimator_ forest attribute, and the contradictory forest classification aggregation descriptions. Forest aggregation is asked only for regression.
- Gradient boosting items use the gradient-specific residual process rather than generic sample-reweighting passages. The residual arithmetic item explicitly supplies its update formula. Full-data wording is confined to the standard process described on the cited page, not all boosting variants.
- No automatic superiority or perfect generalization claims. Kernel transformations need not guarantee separability. The SVM support-vector item is scoped to the basic separating-boundary picture. No answers depend on formula images or linked videos.
- Tree split/leaf constraint identifiers are recovered from exact notebook configurations. The PDF typo is not silently corrected. Repeated snippets mask different parameters and name each requested role; other parameters stay visible to avoid multiple valid answers.
- Questions have newly authored stems and distractors. Shared core concepts with the original bank are intentional; no old item is copied verbatim. Each question has one keyed answer. All MCQ distractors were reviewed for the stated scope.

## Build and visual direction

Built with the html-reviewer skill bundled validator and builder, using its unchanged light terminal template. ui-ux-pro-max was consulted for focus, contrast, native controls and responsive layout; the explicit warm paper/system-monospace requirement takes priority over its generic dark-mode/font suggestions. No new runtime dependencies or network assets.

## Source inventory

- `lecture-notebooks/TS31-WHITTY-decisionTreeCartRegression.ipynb` — SHA-256 `244cc218f61c95786b4f9dae83fb0ab784c61aab38a82a7785ec004d7f68fdb5`
- `lecture-notebooks/TS31-WHITTY-decisionTreeJob.ipynb` — SHA-256 `08a59ab099365c370cce88e72bee06c4c390a59339bcd9aba02b7b4ada8e40aa`
- `lecture-notebooks/gradientBoost/GB-Class-Code1.ipynb` — SHA-256 `f3e2ebf3583eb00d5e20113fd75d0679360d827b4e5dc8767da8258de008b520`
- `lecture-notebooks/gradientBoost/GB-Class-code2 1.ipynb` — SHA-256 `5a5f87723507a1a910d764116d9b2f433064e8272d5e7a8a74efe6ca7ca01b05`
- `lecture-notebooks/randomForest/TS31-WHITTY-RF1.ipynb` — SHA-256 `3d3b58036df1ba58333a9e39027938804752e56260e853bc2398a064e371621f`
- `sa3/docs/M2S3 - Supervised Learning - Part-2 Main.pdf` — SHA-256 `fe56a5fa1fbbe9cd216493a1b7fe1df51b571ce192666526990cbad3ddb0f007`
- `sa3/docs/dTree/Decision Tree - notes.pdf` — SHA-256 `3bd1f89b2b1665cb1a585b7fb38703bd2f37ec919f61c5f997f9139e8f171707`
- `sa3/docs/dTree/Decision Tree.pdf` — SHA-256 `13e65533c335dfed46a6933d93da88300f002006bb8a7e24297645aa474073e8`
- `sa3/docs/dTree/Entropy vs Log_loss.pdf` — SHA-256 `115751661ff1800a3317ccbd2da632a18c724c30be9862572ffebeb82b6ba925`
- `sa3/docs/rForest-gBoost/Ensemble of Trees - Notes.pdf` — SHA-256 `7f351d11410629661defb4389a58359b7f63b2845f0706b63b10a0e453c1a385`
- `sa3/docs/rForest-gBoost/GB Machines - learning_rate.pdf` — SHA-256 `17fb35cc7fca4ae3aa742994ec93c9e95ff3c95f189180f803327e4b933d81a8`
- `sa3/docs/rForest-gBoost/Gradient Boosting.pdf` — SHA-256 `ccc8b21301fb6443ef2f58604136dac2f7c06c5f71e84746258b32a133bdaeb7`
- `sa3/docs/rForest-gBoost/RANDOM FOREST -oob_score.pdf` — SHA-256 `11027814e734092398ba0ed8f438350b86e8ac605dff32feb50436eb06467814`
- `sa3/docs/svm/Support Vector Machine - Notes.pdf` — SHA-256 `e5b9da5ac2005fb78e5e30de1b17abb3a6836b5f7316076abd3507e770b7854e`
- `sa3/docs/svm/notebooks/SVM_Para_Tuning.ipynb` — SHA-256 `051d0a00d6e4f3aa9579174953ba383f9d9339f26738abbd8c95b3e4653f0b44`

## Question/key audit

### CH-DT01 / Decision Trees

mcq; easy

A trained tree receives a new row. How does it determine the prediction region?

a. Follow the learned tests from the root to a leaf.
b. Select the leaf with the most rows in the entire tree.
c. Rebuild the tree using the new row as the target.
d. Average all feature values into a class label.

**Key:** Follow the learned tests from the root to a leaf.

The row follows the branch selected by each test until it reaches its leaf region.

- sa3/docs/M2S3 - Supervised Learning - Part-2 Main.pdf, page 10. Evidence: traversing the tree from the root

### CH-DT02 / Decision Trees

mcq; easy

Which target calls for a regression tree rather than a classification tree?

a. Whether a person is classified as fit or unfit.
b. A continuous estimate of a customer's income.
c. Whether a customer renews: yes or no.
d. Which product category a customer selects.

**Key:** A continuous estimate of a customer's income.

Regression trees predict continuous targets; classification trees predict categories.

- sa3/docs/dTree/Decision Tree - notes.pdf, page 2. Evidence: the outcome variable is Continuous

### CH-DT03 / Decision Trees

mcq; medium

An ID3 node has two candidate tests. Test A gives a larger information gain than test B. What does that comparison mean?

a. A has higher entropy in every child than B.
b. A guarantees higher accuracy on unseen data.
c. A reduces the parent's entropy more after weighting its children.
d. A must create more branches than B.

**Key:** A reduces the parent's entropy more after weighting its children.

Information gain is parent entropy minus weighted child entropy. A greater gain means a greater local impurity reduction, without guaranteeing test accuracy.

- sa3/docs/dTree/Decision Tree.pdf, page 4. Evidence: Information Gain = Entropy(Parent) − Weighted Entropy(Children)

### CH-DT04 / Decision Trees

mcq; medium

A fully grown tree fits the training set perfectly but performs poorly on new rows. Which diagnosis best matches the notes?

a. Insufficient training fit from a tree that is too simple.
b. A proof that the new rows have no usable features.
c. A guarantee that every leaf contains the wrong class.
d. High variance from overfitting.

**Key:** High variance from overfitting.

Unchecked growth can fit the training data too closely and generalize poorly; the notes describe this as high variance.

- sa3/docs/rForest-gBoost/Ensemble of Trees - Notes.pdf, page 1. Evidence: your model will have high error to due variance

### CH-DT05 / Decision Trees

mcq; hard

At a regression-tree node, split A has child MSEs 1 and 9 with child weights 0.9 and 0.1. Split B has child MSEs 3 and 3 with weights 0.5 and 0.5. Which split has the lower weighted MSE?

a. A, because its weighted MSE is 1.8 versus 3.0 for B.
b. B, because its unweighted MSE sum is smaller.
c. They tie because both produce two children.
d. A, because only the lowest child MSE is used.

**Key:** A, because its weighted MSE is 1.8 versus 3.0 for B.

A: 0.9×1 + 0.1×9 = 1.8. B: 0.5×3 + 0.5×3 = 3.0. CART compares child errors weighted by their sample proportions.

- sa3/docs/dTree/Decision Tree - notes.pdf, page 6. Evidence: lowest weighted MSE

### CH-DT06 / Decision Trees

true_false; easy

In a tree diagram, a branch represents the rule or decision connecting nodes, rather than the final predicted outcome.

a. True
b. False

**Key:** True

Branches represent decisions or rules; leaves represent outcomes.

- sa3/docs/dTree/Decision Tree.pdf, page 1. Evidence: each branch represents a decision (rule)
- sa3/docs/dTree/Decision Tree.pdf, page 1. Evidence: each leaf represents an outcome

### CH-DT07 / Decision Trees

true_false; easy

A binary classification node with equal proportions of its two classes is already pure.

a. True
b. False

**Key:** False

An even binary mix has maximum binary entropy. A pure node contains only one class.

- sa3/docs/dTree/Decision Tree.pdf, page 3. Evidence: maximum uncertainty for binary classification

### CH-DT08 / Decision Trees

true_false; medium

Pruning can simplify a tree and help it generalize beyond its training data.

a. True
b. False

**Key:** True

The notes explain that pruning prevents overfitting and yields simpler, more generalizable trees.

- sa3/docs/dTree/Decision Tree - notes.pdf, page 4. Evidence: The pruned trees tend to be simpler and more generalizable.

### CH-DT09 / Decision Trees

blank; easy; hyperparameter; description blank

Name the tree hyperparameter that caps how many levels deep the tree may grow. Enter only the Python parameter identifier.


**Key:** max_depth

max_depth limits tree depth. The job notebook sets this parameter explicitly; the main slides describe depth limits as pre-pruning.

- lecture-notebooks/TS31-WHITTY-decisionTreeJob.ipynb, cell 10. Evidence: max_depth=5
- sa3/docs/M2S3 - Supervised Learning - Part-2 Main.pdf, page 40. Evidence: limiting the maximum depth

### CH-DT10 / Decision Trees

blank; easy; hyperparameter; snippet blank

Restore the missing parameter name from this adapted lecture estimator snippet. It sets the minimum sample count needed to attempt splitting an internal node. Keep all other arguments as shown.

DecisionTreeClassifier(
    max_depth=5, ____=3,
    min_samples_leaf=2, max_leaf_nodes=5
)


**Key:** min_samples_split

The job notebook uses min_samples_split=3 in this position. Enter the identifier, including its underscores.

- lecture-notebooks/TS31-WHITTY-decisionTreeJob.ipynb, cell 10. Evidence: max_depth=5, min_samples_split=3, min_samples_leaf=2, max_leaf_nodes=5

### CH-DT11 / Decision Trees

blank; easy; hyperparameter; snippet blank

Restore the missing parameter name in the supplied regression-tree configuration. It sets the minimum sample count allowed in a leaf. Enter only the identifier.

DecisionTreeRegressor(
    criterion="squared_error", max_depth=4,
    min_samples_split=5, ____=2, random_state=42
)


**Key:** min_samples_leaf

The CART regression notebook sets min_samples_leaf=2 alongside a separate min_samples_split constraint.

- lecture-notebooks/TS31-WHITTY-decisionTreeCartRegression.ipynb, cell 6. Evidence: min_samples_leaf=2

### CH-DT12 / Decision Trees

blank; medium; conceptual identification; description blank

In an ID3-style tree, information gain measures the reduction in which impurity or uncertainty measure? Enter the measure name.


**Key:** entropy

Entropy measures node impurity or uncertainty; information gain measures its reduction after a split.

- sa3/docs/dTree/Decision Tree.pdf, page 4. Evidence: Information Gain = Entropy(Parent) − Weighted Entropy(Children)

### CH-DT13 / Decision Trees

blank; medium; conceptual identification; description blank

Identify the classification splitting criterion described here: it measures class mixing without logarithms, is zero for a pure node, and a tree selects the split with the lowest weighted value.


**Key:** Gini / Gini impurity / Gini index

Gini impurity is zero at a pure node. A Gini-based split minimizes weighted child impurity.

- sa3/docs/dTree/Entropy vs Log_loss.pdf, page 3. Evidence: Gini does not require logarithmic calculations.
- sa3/docs/dTree/Entropy vs Log_loss.pdf, page 3. Evidence: The tree chooses the split with the lowest weighted Gini

### CH-RF01 / Random Forest

mcq; easy

Which sampling operation creates a bootstrap training sample for one tree?

a. Duplicate every feature column without sampling rows.
b. Draw training rows with replacement.
c. Sort rows and keep every second row without replacement.
d. Draw only from the final test set.

**Key:** Draw training rows with replacement.

Bootstrap sampling draws rows with replacement, so rows may repeat and others may be left out for a particular tree.

- sa3/docs/M2S3 - Supervised Learning - Part-2 Main.pdf, page 30. Evidence: with replacement (meaning the same sample can be picked multiple times)

### CH-RF02 / Random Forest

mcq; easy

Where does random feature selection occur in the forest-building process described in the notes?

a. Only when assigning the target column.
b. When replacing each class label with a random label.
c. When selecting candidate features at each split.
d. Only after all trees have finished predicting.

**Key:** When selecting candidate features at each split.

A random subset of features is considered at each split, alongside the separate randomness from row bootstrapping.

- sa3/docs/rForest-gBoost/Ensemble of Trees - Notes.pdf, page 3. Evidence: At each split in the tree, a random subset of features is considered for splitting.

### CH-RF03 / Random Forest

mcq; medium

Why is bagging well suited to parallel training?

a. Each tree must wait for the previous tree's residuals.
b. It uses only one tree, so there are no dependencies.
c. It replaces training with a single validation pass.
d. Its base models train independently on their sampled datasets.

**Key:** Its base models train independently on their sampled datasets.

Bagging trains independent models, allowing them to be trained in parallel. Boosting instead builds a dependent sequence.

- sa3/docs/rForest-gBoost/Ensemble of Trees - Notes.pdf, page 5. Evidence: Because each model is trained independently, Bagging can be parallelized

### CH-RF04 / Random Forest

mcq; medium

An OOB estimate is being computed for training row r. Which trees may contribute predictions for r?

a. Trees whose bootstrap samples did not contain r.
b. Only trees whose bootstrap samples contained r repeatedly.
c. Every tree, using its training prediction for r.
d. Only the single deepest tree, regardless of its sample.

**Key:** Trees whose bootstrap samples did not contain r.

OOB prediction for a row aggregates predictions from trees that did not train on that row.

- sa3/docs/rForest-gBoost/RANDOM FOREST -oob_score.pdf, page 1. Evidence: all trees where that instance was OOB

### CH-RF05 / Random Forest

mcq; hard

A forest uses row bootstrapping and sets max_features to the full feature count. Which conclusion follows?

a. Every tree must have identical predictions on all possible rows.
b. Feature-subset randomness is removed, but bootstrap sampling can still make the trees different.
c. Every source of randomness has been removed.
d. The forest has become a sequential residual-fitting model.

**Key:** Feature-subset randomness is removed, but bootstrap sampling can still make the trees different.

With all features available at each split, that feature-selection randomness disappears. Independently drawn bootstrap samples can still differ.

- sa3/docs/M2S3 - Supervised Learning - Part-2 Main.pdf, page 31. Evidence: no randomness will be injected in the feature selection
- sa3/docs/M2S3 - Supervised Learning - Part-2 Main.pdf, page 30. Evidence: bootstrap sample of our data

### CH-RF06 / Random Forest

true_false; easy

For a random forest regressor, the forest can combine the individual tree predictions by taking their average.

a. True
b. False

**Key:** True

The main slides specify averaging predicted values for forest regression.

- sa3/docs/M2S3 - Supervised Learning - Part-2 Main.pdf, page 29. Evidence: Regression : average of predicted values

### CH-RF07 / Random Forest

true_false; medium

Once an OOB score is available, the OOB supplement recommends dropping the separate test set from final evaluation.

a. True
b. False

**Key:** False

The supplement still recommends a separate test set for final evaluation; OOB is a useful internal estimate.

- sa3/docs/rForest-gBoost/RANDOM FOREST -oob_score.pdf, page 2. Evidence: a separate test set is still recommended for final evaluation.

### CH-RF08 / Random Forest

blank; easy; hyperparameter; description blank

Which forest hyperparameter sets the number of trees to build? Enter the exact identifier.


**Key:** n_estimators

n_estimators controls forest size; it does not set the depth of each individual tree.

- sa3/docs/M2S3 - Supervised Learning - Part-2 Main.pdf, page 30. Evidence: number of trees to build (the n_estimators parameter

### CH-RF09 / Random Forest

blank; easy; hyperparameter; description blank

Which forest hyperparameter controls how many candidate features are considered when splitting a node? Enter the identifier.


**Key:** max_features

max_features controls feature sampling at splits, a separate choice from the number of trees.

- sa3/docs/rForest-gBoost/Ensemble of Trees - Notes.pdf, page 7. Evidence: max_features: Maximum number of features random forest considers splitting a node.

### CH-RF10 / Random Forest

blank; easy; hyperparameter; snippet blank

Restore the missing parameter name from the RF1 estimator configuration. It caps each tree's depth.

RandomForestClassifier(
    random_state=42, n_jobs=-1, ____=5,
    n_estimators=100, oob_score=True
)


**Key:** max_depth

The supplied RF1 estimator sets max_depth=5 while n_estimators separately controls the number of trees.

- lecture-notebooks/randomForest/TS31-WHITTY-RF1.ipynb, cell 5. Evidence: max_depth=5

### CH-RF11 / Random Forest

blank; medium; conceptual identification; description blank

Identify the ensemble method: draw bootstrap samples with replacement, train base models independently, and aggregate their predictions. Enter its name or expanded name.


**Key:** bagging / bootstrap aggregation

Bagging is bootstrap aggregation. Its independently trained models distinguish it from sequential boosting.

- sa3/docs/rForest-gBoost/Ensemble of Trees - Notes.pdf, page 4. Evidence: Also known as Bootstrap Aggregation
- sa3/docs/rForest-gBoost/Ensemble of Trees - Notes.pdf, page 4. Evidence: Independent Training

### CH-RF12 / Random Forest

blank; medium; conceptual identification; description blank

A training row was not selected in the bootstrap sample used by a particular forest tree. What is the term for that row relative to that tree? Enter the full term or its abbreviation.


**Key:** out-of-bag / out of bag / out-of-bag sample / out of bag sample / OOB / OOB sample

That row is out-of-bag (OOB) for this tree. The status is relative to the tree: another tree may have trained on the same row.

- sa3/docs/rForest-gBoost/RANDOM FOREST -oob_score.pdf, page 1. Evidence: These unused samples are called Out-of-Bag (OOB) samples.

### CH-GB01 / Gradient Boosting

mcq; easy

Which description captures how the next tree is used in gradient boosting?

a. It is saved only for drawing the final diagram.
b. It improves the current ensemble by fitting a correction to its errors.
c. It trains independently and ignores the ensemble built so far.
d. It replaces the training labels with random class names.

**Key:** It improves the current ensemble by fitting a correction to its errors.

Trees are added sequentially to correct errors of the current model. They do not form the independent training pattern of bagging.

- sa3/docs/rForest-gBoost/Gradient Boosting.pdf, page 3. Evidence: Trees are fit sequentially to improve error of previous trees.

### CH-GB02 / Gradient Boosting

mcq; medium

Why might a lower learning rate be paired with a larger number of boosting stages?

a. A lower rate disables all regularization.
b. The two parameters always cancel exactly on every dataset.
c. Each tree contributes less, so more trees may be needed for useful corrections.
d. A lower rate automatically makes every tree deeper.

**Key:** Each tree contributes less, so more trees may be needed for useful corrections.

Shrinkage reduces each tree's contribution. More stages may compensate, but the best balance must be tuned rather than assumed.

- sa3/docs/rForest-gBoost/GB Machines - learning_rate.pdf, page 1. Evidence: a smaller learning_rate should be accompanied by a larger number of trees

### CH-GB03 / Gradient Boosting

mcq; medium

A boosted-tree model is overfitting. Which adjustment directly strengthens the pre-pruning of its base trees?

a. Increase each tree's depth without limit.
b. Use the final test labels as new training inputs.
c. Remove the limit on the number of leaves and keep everything else fixed.
d. Reduce the maximum depth allowed for each tree.

**Key:** Reduce the maximum depth allowed for each tree.

Limiting maximum depth is stronger pre-pruning and can reduce overfitting by restricting tree complexity.

- sa3/docs/M2S3 - Supervised Learning - Part-2 Main.pdf, page 40. Evidence: stronger pre-pruning by limiting the maximum depth

### CH-GB04 / Gradient Boosting

mcq; hard

In squared-error boosting, a row has target 12. The current ensemble predicts 9; a new tree predicts residual 2 for that row. With learning rate 0.25, use F_new = F_old + rate × tree_output. What is the residual after the update?

a. 2.5
b. 0.5
c. 1.0
d. 3.5

**Key:** 2.5

The new prediction is 9 + 0.25×2 = 9.5, so target minus prediction is 12 − 9.5 = 2.5. The formula and numbers are supplied; the sources motivate residual fitting and shrinkage.

- sa3/docs/rForest-gBoost/Gradient Boosting.pdf, page 4. Evidence: Compute residuals. For every training example
- sa3/docs/rForest-gBoost/GB Machines - learning_rate.pdf, page 1. Evidence: shrinking the contribution of each tree

### CH-GB05 / Gradient Boosting

mcq; hard

In the standard full-data boosting process described in the process notes, what changes before the next weak learner is fit?

a. The original training set is discarded after the first tree.
b. The residual or gradient targets change as the ensemble improves; previous trees stay in the model.
c. Previously trained trees become extra rows in the training dataset.
d. The original input matrix must gain one row for every new tree.

**Key:** The residual or gradient targets change as the ensemble improves; previous trees stay in the model.

The process keeps the original dataset and updates the residuals or gradients. Weak learners accumulate in the model, rather than being appended to the data.

- sa3/docs/rForest-gBoost/Gradient Boosting.pdf, page 4. Evidence: only the residuals (or gradients) change each round
- sa3/docs/rForest-gBoost/Gradient Boosting.pdf, page 4. Evidence: they are added to the model, not the data.

### CH-GB06 / Gradient Boosting

true_false; easy

A project needs both numeric demand forecasts and churn class labels. Gradient boosting is inherently restricted to just one of these two task types.

a. True
b. False

**Key:** False

The course material explicitly identifies both supervised task types.

- sa3/docs/rForest-gBoost/Gradient Boosting.pdf, page 2. Evidence: used for regression and classification tasks.

### CH-GB07 / Gradient Boosting

true_false; easy

A new tree added by gradient boosting must already be a perfect predictor by itself.

a. True
b. False

**Key:** False

Boosting combines weak models; an individual tree need not solve the full prediction task perfectly.

- sa3/docs/rForest-gBoost/Gradient Boosting.pdf, page 2. Evidence: combines a collection of weak models into a single

### CH-GB08 / Gradient Boosting

true_false; medium

Increasing the learning rate guarantees better generalization because fewer boosting stages are required.

a. True
b. False

**Key:** False

A high learning rate can converge faster but may overfit. Speed does not guarantee better performance on new data.

- sa3/docs/rForest-gBoost/GB Machines - learning_rate.pdf, page 1. Evidence: A high learning_rate can lead to faster convergence but may cause the model to overfit

### CH-GB09 / Gradient Boosting

blank; easy; hyperparameter; description blank

Which gradient-boosting hyperparameter shrinks each tree's contribution to the ensemble? Enter only the parameter identifier.


**Key:** learning_rate

learning_rate controls the size of each tree's contribution, balancing gradual correction against the number of stages.

- sa3/docs/rForest-gBoost/GB Machines - learning_rate.pdf, page 1. Evidence: controls the contribution of each tree to the final model.

### CH-GB10 / Gradient Boosting

blank; easy; hyperparameter; snippet blank

Restore the missing parameter in this gradient-boosting estimator. Here it controls the number of boosting stages.

GradientBoostingClassifier(
    ____=100, learning_rate=0.05,
    random_state=100, max_features=5
)


**Key:** n_estimators

n_estimators sets the stage count in this gradient-boosting configuration. It works together with learning_rate.

- lecture-notebooks/gradientBoost/GB-Class-code2 1.ipynb, cell 14. Evidence: n_estimators=100
- sa3/docs/rForest-gBoost/GB Machines - learning_rate.pdf, page 1. Evidence: number of trees (n_estimators)

### CH-GB11 / Gradient Boosting

blank; easy; conceptual identification; description blank

In squared-error gradient boosting, name the current prediction errors that a new tree is trained to correct. Enter the plural term.


**Key:** residuals / residual errors

Residuals are the current prediction errors. New trees fit corrections to these errors; they are not appended as new data rows.

- sa3/docs/rForest-gBoost/Gradient Boosting.pdf, page 1. Evidence: fitting new models to the residual errors of prior models.
- sa3/docs/rForest-gBoost/Gradient Boosting.pdf, page 4. Evidence: predicting residuals

### CH-GB12 / Gradient Boosting

blank; medium; hyperparameter; snippet blank

Restore the tree-complexity parameter key from the gradient-boosting tuning grid. It caps base-tree depth.

param_grid = {
    "n_estimators": [10, 50, 100, 500],
    "learning_rate": [0.0001, 0.001, 0.01, 0.1, 1.0],
    "____": [3, 5, 7, 9]
}


**Key:** max_depth

max_depth is tuned separately from stage count and learning rate. The main slides identify limiting depth as stronger pre-pruning.

- lecture-notebooks/gradientBoost/GB-Class-Code1.ipynb, cell 10. Evidence: 'max_depth': [3,5,7,9]
- sa3/docs/M2S3 - Supervised Learning - Part-2 Main.pdf, page 40. Evidence: limiting the maximum depth

### CH-GB13 / Gradient Boosting

blank; medium; conceptual identification; description blank

Name the optimization method that gradient boosting combines with sequential weak-learner additions to minimize its loss. Enter the two-word method name.


**Key:** gradient descent

Gradient boosting uses gradient descent in the process of adding weak learners to reduce a loss function.

- sa3/docs/rForest-gBoost/Gradient Boosting.pdf, page 3. Evidence: minimizes a loss function by adding weak learners using gradient descent.

### CH-SV01 / SVM

mcq; easy

For a linearly separable two-class dataset, what geometric goal guides the separating SVM hyperplane?

a. Minimize its distance to every observation in both classes.
b. Place all observations on the same side regardless of their class.
c. Maximize its margin to the nearest observations.
d. Pass through the largest possible number of observations.

**Key:** Maximize its margin to the nearest observations.

The SVM margin is measured relative to the closest observations, and the separating boundary is chosen to maximize it.

- sa3/docs/svm/Support Vector Machine - Notes.pdf, page 5. Evidence: The goal of SVM is to maximize the margins.

### CH-SV02 / SVM

mcq; easy

Which training observations define the separating boundary in the basic SVM picture?

a. Only observations selected by row number.
b. Only observations that have no feature values.
c. All observations in a different test dataset.
d. Support vectors near the separating hyperplane.

**Key:** Support vectors near the separating hyperplane.

The notes identify support vectors as the points closest to the hyperplane that affect its position.

- sa3/docs/svm/Support Vector Machine - Notes.pdf, page 4. Evidence: closest to the hyperplane and which affect the position of the hyperplane.

### CH-SV03 / SVM

mcq; medium

What does the kernel trick let an SVM do?

a. Compute feature-space dot products without explicitly constructing all transformed coordinates.
b. Guarantee perfect separation for any labels.
c. Convert every nonlinear boundary into a straight line in the original input space.
d. Remove the need to choose model hyperparameters.

**Key:** Compute feature-space dot products without explicitly constructing all transformed coordinates.

A kernel evaluates the appropriate dot product from original inputs without explicitly computing the expanded representation.

- sa3/docs/svm/Support Vector Machine - Notes.pdf, page 9. Evidence: without explicitly computing the coordinates
- sa3/docs/svm/Support Vector Machine - Notes.pdf, page 9. Evidence: dot product between the data points in the high-dimensional space

### CH-SV04 / SVM

mcq; medium

With the RBF kernel, what does a smaller gamma mean in the course tuning discussion?

a. A larger penalty C by definition.
b. A broader radius of influence, so more points count as close.
c. A narrower radius of influence around each point.
d. A larger polynomial degree regardless of kernel.

**Key:** A broader radius of influence, so more points count as close.

The slides describe small gamma as a large Gaussian radius. Gamma and C control different aspects of the model.

- sa3/docs/M2S3 - Supervised Learning - Part-2 Main.pdf, page 59. Evidence: A small gamma means a large radius for the gaussian kernel

### CH-SV05 / SVM

mcq; hard

An RBF SVM underfits after scaling. Why might increasing C or gamma be considered during tuning, according to the main slides?

a. Either changes the task from classification to regression.
b. Either guarantees perfect performance on unseen data.
c. Either can allow a more complex fit, so training and validation behavior should be compared.
d. Either must reduce training accuracy and guarantee a wider margin.

**Key:** Either can allow a more complex fit, so training and validation behavior should be compared.

The main slides suggest increasing C or gamma from that underfitting situation to fit a more complex model. This is a tuning direction, not a guarantee of better generalization.

- sa3/docs/M2S3 - Supervised Learning - Part-2 Main.pdf, page 65. Evidence: try increasing either C or gamma to fit a more complex model.

### CH-SV06 / SVM

true_false; easy

A separating hyperplane in a three-dimensional feature space is a two-dimensional plane.

a. True
b. False

**Key:** True

A hyperplane has one fewer dimension than its containing feature space.

- sa3/docs/svm/Support Vector Machine - Notes.pdf, page 4. Evidence: one less dimension than the data space

### CH-SV07 / SVM

true_false; medium

A soft-margin SVM can permit some misclassifications in pursuit of better generalization.

a. True
b. False

**Key:** True

The soft-margin description allows misclassifications to seek better generality.

- sa3/docs/svm/Support Vector Machine - Notes.pdf, page 6. Evidence: allow some misclassifications with the intent of achieving better generality

### CH-SV08 / SVM

blank; easy; conceptual identification; description blank

In the basic separating SVM picture, identify the geometric quantity measured from the hyperplane to the closest observations and maximized when choosing the boundary.


**Key:** margin

The margin is measured relative to the closest observations (support vectors). A separating SVM aims to maximize it.

- sa3/docs/svm/Support Vector Machine - Notes.pdf, page 5. Evidence: The distance between the hyperplane and the observations closest to the hyperplane
- sa3/docs/svm/Support Vector Machine - Notes.pdf, page 5. Evidence: maximize the margins

### CH-SV09 / SVM

blank; easy; hyperparameter; description blank

Which RBF SVM hyperparameter controls the Gaussian kernel width and the scale on which points count as close? Enter its identifier.


**Key:** gamma

gamma controls the Gaussian kernel scale; a smaller gamma corresponds to a larger radius in the slides.

- sa3/docs/M2S3 - Supervised Learning - Part-2 Main.pdf, page 58. Evidence: gamma parameter
- sa3/docs/M2S3 - Supervised Learning - Part-2 Main.pdf, page 58. Evidence: controls the width of the Gaussian kernel

### CH-SV10 / SVM

blank; easy; conceptual identification; description blank

Identify the SVM technique that evaluates feature-space dot products from the original inputs without explicitly constructing all coordinates of the expanded feature representation.


**Key:** kernel trick / the kernel trick

The kernel trick avoids explicitly forming the expanded representation by using a kernel to compute the corresponding dot products.

- sa3/docs/svm/Support Vector Machine - Notes.pdf, page 9. Evidence: Kernel Trick
- sa3/docs/svm/Support Vector Machine - Notes.pdf, page 9. Evidence: without explicitly computing the coordinates

### CH-SV11 / SVM

blank; medium; hyperparameter; description blank

For an SVM using the polynomial kernel, which parameter controls the polynomial order? Enter the identifier, not a recommended number.


**Key:** degree

degree controls the polynomial order. The notes warn that very high values can create excessive complexity and overfitting.

- sa3/docs/svm/Support Vector Machine - Notes.pdf, page 14. Evidence: degree parameter in the polynomial kernel

### CH-SV12 / SVM

blank; medium; hyperparameter; snippet blank

Restore the missing SVC parameter key in this adapted tuning snippet. cSetG is the list of candidate regularization strengths. Enter only the key.

param_grid = {
    "kernel": kernelsG, "____": cSetG,
    "gamma": gammaG
}


**Key:** C

The original tuning notebook maps C to cSetG. Kernel choice and gamma have their own entries.

- sa3/docs/svm/notebooks/SVM_Para_Tuning.ipynb, cell 3. Evidence: param_grid={'kernel':kernelsG,'C':cSetG,'gamma':gammaG}


## Completed verification (2026-11-14)

- Bundled validator: 50 valid items. Builder regression suite: 3 tests passed. Unchanged bundled template browser regression passed.
- Exact type totals 20 MCQ / 10 true-false / 20 blanks; topics 13 / 12 / 13 / 12; difficulty 25 easy / 20 medium / 5 hard. Blanks: 12 hyperparameter identifiers and 8 conceptual identifications.
- All source-evidence excerpts match the original physical PDF pages or notebook cells after whitespace normalization. Every key and distractor reviewed; numeric exercises independently recomputed. No verbatim stem overlaps with the original bank.
- Actual-bank offline browser suite passed: all items in Prep and Exam; correct, incorrect and unanswered cases for every type; perfect 50/50 run; alternate conceptual names; case/whitespace grading and punctuation rejection; Prep answer locking; hidden live-Exam feedback; editing and backtracking; flags; submission confirmation; saved attempts and shuffle persistence; timeout and expired reopening; review filters; reset cancel/confirm; unavailable/read-only storage; keyboard controls. Zero browser errors or HTTP requests.
- Desktop and 360/375/768px layouts inspected, including multiline estimator/tuning snippets. Warm paper colors, system monospace, focus indicators and native controls retained.
- All 35 pre-existing output/reviewer files are byte-for-byte unchanged (SHA-256 compared before/after).
- RevHub integration: separate CS0075 companion card and static public files; the original 60-question assessment and its data remain unchanged. Production export with /revhub base path and TypeScript check passed; 44 repository tests passed; the complete exported-site walkthrough passed 290/290 checks, including the companion URL and mobile view.
- Reproduction: python <html-reviewer-skill>/scripts/build_reviewer.py <stem>.json --output <stem>.html; node verification/<stem>.cjs <stem>.html <absolute-playwright-package-path> <screenshot-directory>. In RevHub the browser verifier is scripts/verify-sa3-companion.cjs.
